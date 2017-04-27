"use strict";

const yaml = require($SRC + "yaml");
const path = require("path");
const fs = require("fs-promise");
const inquirer = require("inquirer");
const isGitUrl = require("is-git-url");

const utils = require("../utils");
const annotatedLoader = require("../ann_loader");
const globals = require("../globals");

const act = require("./actions");

const Storage = require("./storage");
const Task = require("../task");
const Environment = require("../environment/environment");

let projectTypes;
function getProjectTypes() {
  if (!projectTypes) {
    projectTypes = annotatedLoader.collectDirectoryClasses(path.join(__dirname, "types"), "ProjectType", "id");
  }

  return projectTypes;
}

/**
 * Projects controller class.
 */
class Projects {

  /**
   * Creates new project.
   *
   * @param {string} type
   *    Type of project to create.
   *
   * @returns {Promise}
   * @resolve {ProjectBase}
   */
  static create(type = null) {
    const typeChoices = Object.keys(getProjectTypes());
    let promise = Promise.resolve();

    let projectType;
    let creationMethod;

    if (type) {
      if (typeChoices.indexOf(type) === -1) {
        throw new Error(`Undefined type of project '${type}'.`);
      }

      projectType = getProjectTypes()[type];
    }
    else if (!typeChoices.length) {
      throw new Error(`No project types available.`);
    }
    else if  (typeChoices.length === 1) {
      projectType = getProjectTypes()[typeChoices[0]];
    }
    else {
      promise = inquirer.prompt({
        type: "list",
        name: "type",
        message: "Select project type",
        choices: typeChoices,
      }).then((values) => projectType = values.type);
    }

    return promise.then(() => {
      console.log(`-- Creating ${projectType.name} project`);

      const methods = projectType.getCreationMethods();
      const options = Object.keys(methods);

      if (!options.length) {
        throw new Error(`Cannot create project '${projectType.name}' as it doesn't provide any creation methods.`);
      }
      else if (options.length === 1) {
        creationMethod = options.pop();
      }
      else {
        let choices = [];

        options.forEach((option) => {
          choices.push({
            name: option,
            value: option,
            description: methods[option],
          });
        });

        return inquirer.prompt({
          type: "list",
          name: "method",
          message: "Select creation method",
          choices: choices,
        }).then((values) => creationMethod = values.method);
      }
    }).then(() => {
      return new Task({projectFilesReady: act.DownloadProject, gotConfig: act.GetProjectConfig})
        .then({gotRoot: act.AskProjectDirectory})
        .then({projectCreated: act.CreateProject})
        .then(act.SaveEnvironment)
        .then({envComposed: act.ComposeEnvironment, envConfigured: act.CreateServiceConfigFiles})
        .after(["projectFilesReady", "gotRoot"], {projectInPlace: act.MoveProject})
        .after(["envComposed", "envConfigured"], act.SaveProject)
        .start({
          project_type: projectType,
          config: {
            type: projectType.ann("id"),
            creation: creationMethod,
          },
        })
        .then((data) => data.get("project"));
    });
  }

  /**
   * Registers and creates environment for existing project.
   *
   * @param {string} directory
   *    Directory of the existing project.
   *
   * @returns {Task}
   * @resolve {ProjectBase}
   */
  static register(directory) {
    return Environment.hasEnvironment(directory)
      .then((yes) => {
        if (yes) {
          return Environment.readConfig(directory);
        }

        return this.detectType(directory);
      })
      .then((type) => {
        let params = {
          tmp_directory: directory,
          project_types: getProjectTypes(),
          config: {
            creation: "register",
          }
        };

        if (type === false) {
          throw new Error(`Cannot register project. Could not determine type from files.\nPATH: ${directory}`);
        }

        if (typeof type === "string") {
          params.project_type = getProjectTypes()[type];
          params.config.type = type;
          console.log(`\n-- Detected ${params.project_type.name} project`);

          return new Task({gotRoot: act.AskProjectDirectory})
            .then({gotConfig: act.GetProjectConfig, projectInPlace: act.MoveProject})
            .after("gotConfig", (task) => {
              task.then({projectCreated: act.CreateProject})
                .then(act.SaveEnvironment)
                .then({envComposed: act.ComposeEnvironment, envConfigured: act.CreateServiceConfigFiles})
                .after(["envComposed", "envConfigured"], act.SaveProject);
            })
            .start(params)
            .then((data) => data.get("project"));
        }
        else if (typeof type === "object") {
          params.env_config = type;
          params.project_type = getProjectTypes()[type.config.type];
          params.config.type = type.config.type;
          console.log("-- Environment detected");

          return new Task(act.AskProjectDirectory)
            .then({projectInPlace: act.MoveProject})
            .then({projectCreated: act.CreateProject})
            .then(act.SaveEnvironment)
            .then({envComposed: act.ComposeEnvironment, envConfigured: act.CreateServiceConfigFiles})
            .after(["envComposed", "envConfigured"], act.SaveProject)
            .start(params)
            .then((data) => data.get("project"));
        }
      });
  }

  /**
   * Clones repository and creates the project from it.
   *
   * @param {string} repository
   *    The repository address.
   *
   * @returns {Task}
   * @resolve {ProjectBase}
   */
  static clone(repository = null) {
    let promise;

    if (repository) {
      promise = Promise.resolve(repository);
    }
    else {
      promise = inquirer.prompt({
        type: "input",
        name: "repository",
        message: "Project repository",
        validate: (repo) => isGitUrl(repo) ? true : "Enter a valid git url.",
      }).then((values) => values.repository);
    }
    
    return promise
      .then((repository) => {
        // If the repository does not end in .git then we should assume that
        // it was omitted as a copy past from URL bars. In this situation
        // just append it at the end.
        if (repository.substr(-4) !== ".git") {
          repository += ".git";
        }

        if (!isGitUrl(repository)) {
          throw new Error(`The provided repository is not a valid git URL:\n${repository}`);
        }

        return new Task(act.CloneProject)
          .start({repository: repository});
      })
      .then((data) => {
        let dir = data.get("tmp_directory");
        return this.register(dir);
      });
  }

  /**
   * Loads in project by key.
   *
   * @param {string} key
   *    Project key.
   *
   * @returns {Promise}
   * @resolve {ProjectBase}
   */
  static load(key) {
    return Storage.get(key)
      .then((data) => {
        if (data === null) {
          throw new Error(`Project not found by key '${key}'.`);
        }

        return new (getProjectTypes()[data.type])(data.root, data.config);
      });
  }

  /**
   * Loads in project by directory.
   *
   * @param {string} dir
   *    Project directory.
   *
   * @returns {Promise}
   * @resolve {ProjectBase}
   */
  static loadDir(dir) {
    return Storage.getByDirectory(dir)
      .then((data) => {
        if (data === null) {
          throw new Error(`Project not found in '${dir}'.`);
        }

        data = data.data;
        return new (getProjectTypes()[data.type])(data.root, data.config);
      });
  }

  /**
   * Detects type of project in directory from files.
   *
   * @param {string} directory
   *    The directory of the project.
   *
   * @returns {Promise}
   * @resolve {string|boolean}
   *    The type of the project or false if it could not determine.
   */
  static detectType(directory) {
    let promises = [];

    for (const [, Project] of Object.entries(getProjectTypes())) {
      promises.push(Project.isInDirectory(directory, false));
    }

    return Promise.all(promises).then(() => false, (type) => type);
  }

}

Projects.STORAGE_FILE = path.join(globals.GLOBAL_STORE_ROOT, "projects.yml");

module.exports = Projects;
