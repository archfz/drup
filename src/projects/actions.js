"use strict";

const fs = require("fs-promise");
const path = require("path");
const inquirer = require("inquirer");
const yaml = require("node-yaml");
const globals = require("./globals");

const Action = require("../task/action");
const Command = require("../system/system_command");
const Environment = require("../environment/environment");
const Loader = require("../terminal-utils/async_loader");

module.exports = {

  CloneProject: class extends Action {
    complete(data) {
      let loader = new Loader("Preparing temp dir");

      return fs.ensureDir(globals.TEMPORARY_DIR)
        .then(() => fs.emptyDir(globals.TEMPORARY_DIR))
        .then(() => {
          process.chdir(globals.TEMPORARY_DIR);

          loader.setMessage("Cloning repository");
          return new Command("git", ["clone", data.get("repository")])
            .execute();
        }).then((output) => {
          const dir = output.match(/Cloning into '(\w+)'\.{3}/);

          if (typeof dir[1] !== "string") {
            throw new Error("Failed to determine target directory on git clone.");
          }

          data.set("tmp_directory", globals.TEMPORARY_DIR + dir[1]);
          loader.finish("Project successfully cloned!");
        });
    }
  },

  DetectEnvironment: class extends Action {
    complete(data) {
      let file = path.normalize(data.get("tmp_directory") + "/" + globals.ENV_CONFIG_FILENAME);

      return yaml.read(file).then(
        (content) => data.set("env_data", content || false),
        () => data.set("env_data", false)
      );
    }
  },

  DetectProjectType: class extends Action {
    complete(data) {
      let promises = [];

      for (const [, Project] of Object.entries(data.get("project_types"))) {
        promises.push(Project.isInDirectory(data.get("tmp_directory"), false));
      }

      return Promise.all(promises).then(
        () => data.set("type", false),
        (type) => data.set("type", type)
      ).then(this.resolve);
    }
  },

  AskProjectType: class extends Action {
    complete(data) {
      return inquirer.prompt({
        type: "list",
        name: "type",
        message: "Select project type",
        choices: Object.keys(data.get("project_types")),
      }).then((values) => {
        data.set("type", values.type);
      });
    }
  },

  AskProjectConfig: class extends Action {
    complete(data) {
      const dirName = data.get("tmp_directory").split("/").pop();
      const projectName = dirName.charAt(0).toUpperCase() + dirName.substr(1).toLowerCase();
      const urlSafeName = dirName.toLowerCase().replace(/\s+/g, "-");

      return inquirer.prompt([{
        type: "input",
        name: "name",
        message: "Project name",
        default: projectName,
      }, {
        type: "input",
        name: "hostAlias",
        message: "Project host alias",
        default: urlSafeName + ".dev",
      }]).then((values) => data.set("config", values));
    }
  },

  AskProjectDirectory: class extends Action {
    complete(data) {
      const dirName = data.get("tmp_directory").split("/").pop();
      const urlSafeName = dirName.toLowerCase().replace(/\s+/g, "-");

      return inquirer.prompt({
        type: "input",
        name: "directory",
        message: "Project directory",
        default: `${globals.PROJECTS_DIR}${data.get("type")}/${urlSafeName}`,
      }).then((values) => data.set("directory", values.directory));
    }
  },

  CreateDirectoryStructure: class extends Action {
    complete(data) {
      const baseDir = path.normalize(data.get("directory"));

      return fs.ensureDir(baseDir).then(() => {
        return Promise.all(
          ["project", "data", "config", "log"].map((dir) => {
            return fs.ensureDir(baseDir + dir);
          })
        );
      });
    }
  },

  MoveProject: class extends Action {
    complete(data) {
      let loader = new Loader("Moving project");

      return fs.copy(data.get("tmp_directory"), data.get("directory") + "/project")
        .then(() => {
          loader.finish("Project moved to new location");
        });
    }
  },

  CreateProjectEnvironment: class extends Action {
    complete(data) {
      const configurator = data.get("project_types")[data.get("type")].getEnvConfigurator();

      return Environment.create(configurator, data.get("config"))
        .then((env) => data.set("env", env));
    }
  },

  SaveEnvironment: class extends Action {
    complete(data) {
      return inquirer.prompt({
        type: "question",
        message: "Include environment config in repository?",
        name: "include",
        default: true,
      }).then((values) => {
        let path = data.get("directory");

        if (values.include) {
          path += "/project";
        }

        data.get("env").saveConfigTo();
        data.set("env_path", path);
      });
    }
  },

  ComposeEnvironment: class extends Action {
    complete(data) {
      return data.get("env").composeContainer("*", data.get("directory"));
    }
  }

};