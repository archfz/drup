"use strict";

const yaml = require("node-yaml");
const path = require("path");
const fs = require("fs-promise");
const inquirer = require("inquirer");
const isGitUrl = require("is-git-url");

const utils = require("../utils");
const globals = require("../globals");

const act = require("./actions");

const Storage = require("./storage");
const Task = require("../task");
const Environment = require("../environment/environment");

let projectTypes;
function getProjectTypes() {
  if (!projectTypes) {
    projectTypes = utils.collectAnnotated(path.join(__dirname, "types"), "id", true);
  }

  return projectTypes;
}

class Projects {

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
      console.log(`\n-- Creating ${projectType.name} project\n`);

      const methods = projectType.getCreationMethods();
      const options = Object.keys(methods);

      if (!options.length) {
        throw new Error(`Cannot create project '${projectType.name}' as it doesn't provide any creation methods.`);
      }
      else if (options.length === 1) {
        creationMethod = methods[0];
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
        .after(["projectCreated", "projectInPlace"], {setupCompleted: act.SetupProject})
        .after(["setupCompleted", "envComposed", "envConfigured"], act.SaveProject)
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
          console.log(`\n-- Detected ${params.project_type.name} project\n`);
        }
        else if (typeof type === "object") {
          params.env_config = type;
        }

        return new Task({gotRoot: act.AskProjectDirectory})
          .then({gotConfig: act.GetProjectConfig, projectInPlace: act.MoveProject})
          .after("gotConfig", (task) => {
            task.then({projectCreated: act.CreateProject})
              .then(act.SaveEnvironment)
              .then({envComposed: act.ComposeEnvironment, envConfigured: act.CreateServiceConfigFiles})
              .after(["projectCreated", "projectInPlace"], {setupCompleted: act.SetupProject})
              .after(["setupCompleted", "envComposed", "envConfigured"], act.SaveProject);
          })
          .start(params)
          .then((data) => data.get("project"));
      });
  }

  static clone(repository = null) {
    let promise;

    if (repository) {
      if (!isGitUrl(repository)) {
        throw new Error(`The provided repository is not a valid git URL:\n${repository}`);
      }

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
        return new Task(act.CloneProject)
          .start({repository: repository});
      })
      .then((data) => {
        let dir = data.get("tmp_directory");
        return this.register(dir);
      });
  }

  static load(key) {
    return Storage.get(key)
      .then((data) => {
        if (data === null) {
          throw new Error(`Project not found by key '${key}'.`);
        }

        return new (getProjectTypes()[data.type])(data.root, data.config);
      });
  }

  static loadDir(dir) {
    return Storage.getByDirectory(dir)
      .then((data) => {
        if (data === null) {
          throw new Error(`Project not found in '${dir}'.`);
        }

        return new (getProjectTypes()[data.type])(data.root, data.config);
      });
  }

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
