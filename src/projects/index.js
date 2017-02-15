"use strict";

const yaml = require("node-yaml");
const path = require("path");
const fs = require("fs-promise");
const inquirer = require("inquirer");

const utils = require("../utils");
const globals = require("../globals");

const act = require("./actions");

const ProjectBase = require("./base");
const Task = require("../task");

let projectTypes;
function getProjectTypes() {
  if (!projectTypes) {
    projectTypes = utils.collectAnnotated(__dirname, "id", true);
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

      projectType = type;
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

    promise.then(() => {
      console.log(`\n-- Creating ${projectType.constructor.name} project\n`);

      const methods = projectType.getCreationMethods();
      const options = Object.keys(methods);

      if (!options.length) {
        throw new Error(`Cannot create project '${projectType.constructor.name}' as it doesn't provide any creation methods.`);
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
      return new Task({projectDownloaded: act.DownloadProject, gotConfig: act.AskProjectConfig})
        .after("gotConfig", (task) => {
          task.then(act.AskProjectDirectory)
            .then({envCreated: act.CreateProject})
            .then(act.SaveEnvironment, act.ComposeEnvironment, act.SaveProject)
            .after(["projectDownloaded"], {projectMoved: act.MoveProject});
        })
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
    return new Task(act.DetectEnvironment)
      .ifThen((data) => data.get("env_data") !== false, (task) => {
        task.then(act.CreateDirectoryStructure)
          .then(act.MoveProject, act.SaveEnvironment, act.ComposeEnvironment);
      })
      .otherwise((task) => {
        task.then(act.DetectProjectType)
          .ifThen((data) => data.get("type") === false, act.AskProjectType)
          .then(act.AskProjectDirectory)
          .then(act.AskProjectConfig)
          .after("dirCreated", act.MoveProject)
          .then({envCreated: act.CreateProjectEnvironment})
          .after(["dirCreated", "envCreated"], (task) => {
            task.then(act.SaveEnvironment, act.ComposeEnvironment, act.CreateServiceConfigFiles);
          });

      })
      .start({
        tmp_directory: dir,
        project_types: this.getTypes(),
      });
  }

  static clone(repository) {

  }

  static types() {

  }

  static load(key) {

  }

  static loadByDirectory(dir) {

  }

  static list() {

  }

  static listByType(type) {

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
