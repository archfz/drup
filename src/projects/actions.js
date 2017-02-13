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
      let loader, promise = Promise.resolve();

      if (!data.get("repository")) {
        promise = inquirer.prompt({
          type: "input",
          name: "repository",
          message: "Git repository",
        }).then((values) => data.set("repository", values.repository));
      }

      return promise
        .then(() => {
          loader = new Loader("Cloning repository");
          return fs.emptyDir(globals.TEMPORARY_DIR);
        })
        .then(() => {
          process.chdir(globals.TEMPORARY_DIR);

          return new Command("git", ["clone", data.get("repository")])
            .execute();
        }).then((output) => {
          const dir = output.match(/Cloning into '(\w+)'\.{3}/);

          if (typeof dir[1] !== "string") {
            throw new Error("Failed to determine target directory on git clone.");
          }

          data.set("tmp_directory", path.normalize(globals.TEMPORARY_DIR + dir[1]));
          loader.finish("Project successfully cloned!");
        });
    }
  },

  DetectEnvironment: class extends Action {
    complete(data) {
      let file = path.join(data.get("tmp_directory"), globals.ENV_CONFIG_FILENAME);

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
        data.set("project_type", data.get("project_types")[values.type]);
      });
    }
  },

  AskInstallationMethod: class extends Action {
    complete(data) {
      let project = data.get("project_type");
      let choices = [];

      for (let [method, description] of Object.entries(project.getInstallationMethods())) {
        choices.push({
          name: method,
          value: method,
          description: description,
        });
      }

      return inquirer.prompt({
        type: "list",
        name: "method",
        message: "Select installation method",
        choices: choices,
      }).then((values) => data.set("installation_method", values.method));
    }
  },

  DownloadProject: class extends Action {
    complete(data) {
      const method = data.get("installation_method");
      const tmpDir = path.join(globals.TEMPORARY_DIR, "new_tmp" + Date.now());

      data.set("tmp_directory", tmpDir);

      this.loader = new Loader("Downloading project");
      return fs.emptyDir(globals.TEMPORARY_DIR)
        .then(() => {
          this.cmd = data.get("project_type").download(method, tmpDir);
          this.cmd.onData((data) => {
            this.loader.setMessage(data);
          });

          return this.cmd.execute();
        })
        .then(() => {
          this.loader.finish("Project downloaded!");
        });
    }

    revert() {
      this.cmd.kill();
      this.loader.destroy();
    }
  },

  AskProjectConfig: class extends Action {
    complete(data) {
      const dirName = data.get("tmp_directory").split("/").pop();
      let projectName = null;

      if (dirName.search("new_tmp") === -1) {
        projectName = dirName.charAt(0).toUpperCase() + dirName.substr(1).toLowerCase();
      }

      return inquirer.prompt([{
        type: "input",
        name: "name",
        message: "Project name",
        default: projectName,
        validate: (value) => value.match(/^[a-zA-Z0-9 ]+$/) ? true : "Project name is required, and can only contain letters, numbers and space.",
      }, {
        type: "input",
        name: "hostAlias",
        message: "Project host alias",
        default: (values) => values.name.toLowerCase().replace(/\s+/g, "-") + ".dev",
      }]).then((values) => data.set("config", values));
    }
  },

  AskProjectDirectory: class extends Action {
    complete(data) {
      let baseName = data.get("config.name");
      if (!baseName) {
        baseName = path.basename(data.get("tmp_directory"));
      }

      const urlSafeName = baseName.toLowerCase().replace(/\s+/g, "-");
      const defaultPath = path.join(globals.PROJECTS_DIR, data.get("type"), urlSafeName);

      return inquirer.prompt({
        type: "input",
        name: "directory",
        message: "Project directory",
        default: defaultPath,
      }).then((values) => {
        data.set("directory", path.normalize(values.directory));
      });
    }
  },

  CreateDirectoryStructure: class extends Action {
    complete(data) {
      const baseDir = path.normalize(data.get("directory"));

      return fs.ensureDir(baseDir).then(() => {
        return Promise.all(
          ["project", "data", "config", "log"].map((dir) => {
            return fs.ensureDir(path.join(baseDir, dir));
          })
        );
      });
    }
  },

  MoveProject: class extends Action {
    complete(data) {
      this.loader = new Loader("Moving project");
      this.dest = path.join(data.get("directory"), "project");

      return fs.copy(data.get("tmp_directory"), this.dest)
        .then(() => {
          this.loader.finish("Project moved to new location");
        });
    }

    revert() {
      console.log("FUCK");
      this.loader.destroy();
    }
  },

  CreateProjectEnvironment: class extends Action {
    complete(data) {
      const configurator = data.get("project_types")[data.get("type")].getEnvConfigurator();

      data.set("config.env_name", data.get("config.name").replace(/\s+/g, "_").toLowerCase());

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
        let envPath = data.get("directory");

        if (values.include) {
          envPath += "/project";
        }

        envPath = path.join(envPath, globals.ENV_CONFIG_FILENAME);
        data.set("env_path", envPath);
        return data.get("env").saveConfigTo(envPath);
      });
    }
  },

  ComposeEnvironment: class extends Action {
    complete(data) {
      this.loader = new Loader("Composing environment");
      return data.get("env").composeContainer("*", data.get("directory"))
        .then(() => {
          this.loader.finish("Environment composed");
        });
    }
  },

  RunProjectPostInstall: class extends Action {
    complete(data) {
      return data.get("project_type").postInstall(data);
    }
  }

};