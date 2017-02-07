"use strict";

const fs = require("../fs_utils");
const inquirer = require("inquirer");
const yaml = require("node-yaml");
const globals = require("./globals");

const Action = require("../task/action");
const Command = require("../system/system_command");
const Environment = require("../environment/environment");

const manager = require("./manager");

class CloneProjectAction extends Action {

  get resultKey() {
    return "directory";
  }

  complete(params) {
    fs.setDirectory(globals.TEMPORARY_DIR, true);

    new Command("git", ["clone", params.repository]).execute().then((output) => {
      const dir = output.match(/Cloning into '(\w+)'\.{3}/);

      if (typeof dir[1] !== "string") {
        throw new Error("Failed to determine target directory on git clone.");
      }

      this.resolve(globals.TEMPORARY_DIR + dir[1] + "/");
    });
  }

}

class DetectEnvironmentAction extends Action {

  get resultKey() {
    return "env_data";
  }

  complete(params) {
    yaml.read(fs.toPath(params.directory) + globals.ENV_CONFIG_FILENAME).then(
      (data) => this.resolve(data),
      () => this.resolve(false)
    );
  }

}

class DetectProjectTypeAction extends Action {

  get resultKey() {
    return "project_type";
  }

  complete(params) {
    let promises;

    for (const [, Project] of Object.entries(manager.getTypes())) {
      promises.push(Project.isInDirectory(params.directory, false));
    }

    Promise.all(promises).then(
      () => this.resolve(false),
      (type) => this.resolve(type)
    );
  }

}

class AskProjectTypeAction extends Action {

  get resultKey() {
    return "project_type";
  }

  complete() {
    inquirer.prompt({
      type: "list",
      name: "type",
      message: "Select project type",
      choices: Object.keys(manager.getTypes()),
    }).then((values) => this.resolve(values.type));
  }

}

class AskProjectConfigAction extends Action {

  get resultKey() {
    return "config";
  }

  complete(params) {
    const dirName = params.directory.split("/").pop();
    const projectName = dirName.charAt(0).toUpperCase() + dirName.slice(0).toLowerCase();
    const urlSafeName = dirName.toLowerCase().replace(/\s+/g, "-");

    inquirer.prompt([{
      type: "input",
      name: "name",
      message: "Project name",
      default: projectName,
    }, {
      type: "input",
      name: "hostAlias",
      message: "Project host alias",
      default: urlSafeName + ".dev",
    }, {
      type: "input",
      name: "directory",
      message: "Project directory",
      default: `${globals.PROJECTS_DIR}${params.project_type}/${urlSafeName}`,
    }]).then((values) => this.resolve(values));
  }

}

class CreatDirectorySructureAction extends Action {

  complete(params) {
    const baseDir = fs.toPath(params.config.directory);
    fs.ensureDirectory(baseDir);
    ["project", "data", "config", "log"].forEach((dir) => {
      fs.ensureDirectory(baseDir + dir);
    });

    this.resolve();
  }

}

class MoveProjectDataAction extends Action {

  complete(params) {
    fs.copy(params.tmp_dir, params.config.directory + "/project");
    this.resolve();
  }

}


class CreateProjectEnvironmentAction extends Action {

  get resultKey() {
    return "environment";
  }

  complete(params) {
    const configurator = manager.getTypes()[params.project_type].envConfigurator();

    Environment.create(configurator, params.config)
      .then((env) => this.resolve(env));
  }

}

class SaveEnvironmentAction extends Action {
  
  get resultKey() {
    return "environment_path";
  }
  
  complete(params) {
    inquirer.prompt({
      type: "question",
      message: "Include environment config in repository?",
      name: "include",
      default: true,
    }).then((values) => {
      let path = params.config.directory;
      
      if (values.include) {
        path += "/project";
      }

      params.environment.saveConfigTo();
      this.resolve(path);
    });
  }
  
}

class ComposeEnvironmentContainers extends Action {

  complete(params) {
    params.environment.composeContainer("*", params.config.directory)
      .then(() => {
        this.resolve();
      });
  }

}

exports.CloneProject = CloneProjectAction;
exports.DetectEnvironment = DetectEnvironmentAction;
exports.DetectProjectType = DetectProjectTypeAction;
exports.AskProjectType = AskProjectTypeAction;
exports.AskProjectConfig = AskProjectConfigAction;
exports.CreateDirectoryStructure = CreatDirectorySructureAction;
exports.MoveProject = MoveProjectDataAction;
exports.CreateProjectEnvironment = CreateProjectEnvironmentAction;
exports.SaveEnvironment = SaveEnvironmentAction;
exports.ComposeEnvironment = ComposeEnvironmentContainers;

module.exports = exports;