"use strict";

const fs = require("fs-promise");
const fsu = require($SRC + "fs_utils.js");
const path = require("path");
const inquirer = require("inquirer");
const yaml = require($SRC + "yaml");
const globals = require("../globals");

const Action = require("../task/action");
const Command = require("../system/system_command");
const Environment = require("../environment/environment");
const Loader = require("../terminal-utils/async_loader");

const DirectoryInput = require("../form_input/directory_input");

module.exports = {

  CloneProject: class extends Action {
    complete(data) {
      let promise = Promise.resolve();

      return promise
        .then(() => {
          this.loader = new Loader("Cloning repository");
          return fs.emptyDir(globals.TEMPORARY_DIR);
        })
        .then(() => {
          process.chdir(globals.TEMPORARY_DIR);

          return new Command("git", ["clone", data.get("repository")])
            .execute();
        }).then((output) => {
          const dir = output.match(/Cloning into '([^']+)'\.{3}/);

          if (!dir || typeof dir[1] !== "string") {
            throw new Error("Failed to determine target directory on git clone.\nGIT clone output:\n" + output);
          }

          data.set("tmp_directory", path.normalize(globals.TEMPORARY_DIR + dir[1]));
          this.loader.finish("Project successfully cloned!");
        });
    }
    revert() {
      this.loader && this.loader.destroy();
    }
  },

  DownloadProject: class extends Action {
    complete(data) {
      const method = data.get("config.creation");
      const tmpDir = path.join(globals.TEMPORARY_DIR, "new_tmp" + Date.now());

      data.set("tmp_directory", tmpDir);

      this.loader = new Loader("Downloading project");
      return fs.emptyDir(tmpDir)
        .then(() => {
          this.cmd = data.get("project_type").download(method, tmpDir);

          return this.cmd.execute();
        })
        .then(() => {
          this.loader.finish("Project downloaded!");
        });
    }

    revert() {
      this.cmd && this.cmd.kill();
      this.loader && this.loader.destroy();
      return this.removeTempDirectory();
    }

    removeTempDirectory() {
      return fs.remove(this._data.get("tmp_directory"));
    }
  },

  GetProjectConfig: class extends Action {
    complete(data) {
      let envConfig = data.get("env_config");

      if (envConfig) {
        data.set("config", envConfig.config);
      }

      const dirName = path.basename(data.get("tmp_directory"));
      let suggestions = {};

      if (dirName.search("new_tmp") === -1) {
        suggestions.name = dirName.charAt(0).toUpperCase() + dirName.substr(1).toLowerCase();
      }

      return data.get("project_type").configure(suggestions)
        .then((values) => Object.assign(data.get("config"), values));
    }
  },

  AskProjectDirectory: class extends Action {
    complete(data) {
      let type = data.get("config.type");
      let baseName = data.get("config.name");

      if (!type) {
        throw new Error("Type is not set.");
      }

      if (!baseName) {
        baseName = path.basename(data.get("tmp_directory"));
      }

      const urlSafeName = baseName.toLowerCase().replace(/\s+/g, "-");
      const defaultPath = path.join(globals.PROJECTS_DIR, type, urlSafeName);

      console.log();
      return fsu.suggestEmptyDirectory(defaultPath)
        .then((path) => {
          return DirectoryInput.create("Project directory:", "Choose the final root directory for the project files. Use \"./\" to add current working directory relative path.".green)
            .setDefault(path)
            .warnNonEmpty()
            .warnPathLengthLimitations(40)
            .acquire();
        })
        .then((directory) => data.set("root", directory));
    }
  },

  MoveProject: class extends Action {
    complete(data) {
      let root = data.get("root");

      if (!root) {
        throw new Error("Attempted to move project without root.");
      }

      this.loader = new Loader("Moving project");
      this.dest = path.join(root, Environment.DIRECTORIES.PROJECT);

      return fs.ensureDir(this.dest)
        .then(() => fs.copy(data.get("tmp_directory"), this.dest))
        .then(() => this.loader.finish("Project moved to new location"));
    }
    revert() {
      this.loader.destroy();
    }
  },

  CreateProject: class extends Action {
    complete(data) {
      const env = data.get("env_config");
      let project;

      if (env) {
        project = new (data.get("project_types")[env.config.type])(data.get("root"), env.config);
        data.set("project", project);
        return project.getEnvironment();
      }
      else {
        project = new (data.get("project_type"))(data.get("root"), data.get("config"));
        data.set("project", project);
        return project.createEnvironment(data.get("tmp_directory"));
      }
    }
    revert(data) {
      return fs.remove(data.get("root"));
    }
  },

  SaveEnvironment: class extends Action {
    complete(data) {
      let promise;

      if (data.get("env_config")) {
        promise = Promise.resolve({include: true});
      }
      else {
        console.log();
        console.log("Choose yes if you would like to share the drup configuration. This allows other people to recreate the same environment on other systems.".green);

        promise = inquirer.prompt({
          type: "confirm",
          message: "Add configuration to project root?",
          name: "include",
          default: true,
        });
      }

      return promise.then((values) => {
        return data.get("project").getEnvironment().then((env) => env.save(values.include));
      });
    }
  },

  ComposeEnvironment: class extends Action {
    complete(data) {
      this.loader = new Loader("Composing environment");
      return data.get("project").getEnvironment().then((env) => env.composeContainer("*"))
        .then(() => {
          this.loader.finish("Environment composed");
        });
    }
  },

  CreateServiceConfigFiles: class extends Action {
    complete(data) {
      this.loader = new Loader("Creating service configurations");
      return data.get("project").getEnvironment().then((env) => env.writeServiceConfigFiles())
        .then(() => {
          this.loader.finish("Service configurations created");
        });
    }
  },

  SaveProject: class extends Action {
    complete(data) {
      return data.get("project").save();
    }
  }

};