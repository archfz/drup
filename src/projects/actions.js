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

  MoveProject: class extends Action {
    complete(data) {
      this.loader = new Loader("Moving project");
      this.dest = path.join(data.get("directory"), Environment.DIRECTORIES.PROJECT);

      return fs.ensureDir(this.dest)
        .then(() => {
          return fs.copy(data.get("tmp_directory"), this.dest)
        })
        .then(() => {
          this.loader.finish("Project moved to new location");
        });
    }

    revert() {
      this.loader.destroy();
    }
  },

  CreateProjectEnvironment: class extends Action {
    complete(data) {
      const configurator = data.get("project_types")[data.get("type")].getEnvConfigurator();

      data.set("config.env_name", data.get("config.name").replace(/\s+/g, "_").toLowerCase());

      return Environment.create(configurator, data.get("config"), data.get("directory"))
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
        this.loader = new Loader("Creating environment structure");
        return data.get("env").save(values.include)
          .then(() => {
            this.loader.finish("Environment structure created");
          });
      });
    }
  },

  ComposeEnvironment: class extends Action {
    complete(data) {
      this.loader = new Loader("Composing environment");
      return data.get("env").composeContainer("*")
        .then(() => {
          this.loader.finish("Environment composed");
        });
    }
  },

  CreateServiceConfigFiles: class extends Action {
    complete(data) {
      this.loader = new Loader("Creating service configurations");
      return data.get("env").addServiceConfigFiles()
        .then(() => {
          this.loader.finish("Service configurations created");
        });
    }
  },

  RunProjectPostInstall: class extends Action {
    complete(data) {
      return data.get("project_type").postInstall(data);
    }
  }

};