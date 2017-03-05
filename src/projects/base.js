"use strict";

const inquirer = require("inquirer");
const fs = require("fs-promise");

const utils = require("../utils");

const ProjectStorage = require("./storage");
const Environment = require("../environment/environment");
const ServiceCollection = require("../environment/service_collection");

module.exports = class ProjectBase {

  constructor(root, config) {
    this._root = root;
    this._key = config.key;
    this._config = config;
  }

  /**
   * Gathers configuration for a project.
   *
   * @param suggestions
   *    Current config values to build suggestions.
   *
   * @returns {Promise}
   *    Promise that will result in the config.
   */
  static configure(suggestions = {}) {
    let name = null;

    if (suggestions.name) {
      name = suggestions.name.replace(/(_|-)+/g, " ").replace(/[^a-zA-Z0-9 ]+/g, "");
      name = name.charAt(0).toUpperCase() + name.substr(1).toLowerCase();
    }

    return inquirer.prompt({
      type: "input",
      name: "name",
      message: "Project name",
      default: name,
      validate: (value) => value.match(/^[a-zA-Z0-9 ]+$/) ? true : "Project name is required, and can only contain letters, numbers and space.",
      filter: (value) => value.trim()
    }).then((values) => {
      return ProjectBase.generateUniqueKey(values.name)
        .then((key) => {
          values.key = key;
          return values;
        });
    }).then((values) => {
      const askKey = function (defaultKey) {
        return inquirer.prompt({
          type: "input",
          name: "key",
          message: "Project key",
          description: "Unique identifier for the project.",
          default: defaultKey,
          validate: (key) => {
            if (!key) {
              return "Project key is required.";
            }

            if (!key.match(/^[a-zA-Z0-9\-_]+$/)) {
              return "Key may only container letters, numbers and _ or -";
            }

            return true;
          },
          filter: (value) => value.toLowerCase(),
        }).then((values) => {
          return ProjectBase.isKeyUnique(values.key)
            .then((unique) => {
              if (unique) {
                return values.key;
              }

              console.warn("A project already has this key.");

              return askKey(values.key);
            });
        });
      };

      return ProjectBase.generateUniqueKey(values.name)
        .then((key) => askKey(key))
        .then((key) => {
          values.key = key;
          return values;
        });
    });
  }

  static generateUniqueKey(suggestion) {
    let words = suggestion.split(/[ ]+/);
    if (words.length > 2) {
      suggestion = words.map((word) => word.charAt(0)).join("").toLowerCase();
    }
    else {
      suggestion = suggestion.replace(" ", "_");
    }

    const generateKey = (count = "") => {
      return ProjectBase.isKeyUnique(suggestion + count)
        .then((unique) => {
          if (unique) {
            return suggestion + count;
          }

          return generateKey(count === "" ? 2 : count + 1);
        });
    };

    return generateKey();
  }

  static isKeyUnique(key) {
    return ProjectStorage.get(key)
      .then((config) => config === null);
  }

  /**
   * Gets the available creation methods for this project.
   *
   * @return {object}
   *    Object with keys as the method names and their values as description.
   */
  static getCreationMethods() {
    utils.mustImplement(this, "getCreationMethods");
  }

  /**
   * Gets the environment configurator for this type of project.
   *
   * @return {EnvironmentConfigurator}
   */
  static getEnvConfigurator() {
    utils.mustImplement(this, "getEnvConfigurator");
  }

  /**
   * Determine if in the given directory relies a project of this type.
   *
   * @param dir
   *    The directory in which to check.
   * @param resolveOnPositive
   *    Whether resolve means yes, otherwise reject means yes.
   *
   * @return {Promise}
   */
  static isInDirectory(dir, resolveOnPositive = true) {
    utils.mustImplement(this, "isInDirectory");
  }

  /**
   * Downloads this type of project in provided directory.
   *
   * @param method
   * @param toDir
   */
  static download(method, toDir) {
    utils.mustImplement(this, "download");
  }

  setup() {
    return Promise.resolve();
  }

  save() {
    return ProjectStorage.set(this._key, {
      root: this.root,
      type: this.ann("id"),
      config: this._config
    });
  }

  remove() {
    return fs.rmdir(this.root)
      .then(() => {
        return ProjectStorage.remove(this._key);
      });
  }

  start(getContainer = false) {
    return this.getEnvironment().then((env) => env.getContainer("docker").start())
      .then((container) => getContainer ? container : this);
  }

  stop(getContainer = false) {
    return this.getEnvironment().then((env) => env.getContainer("docker").stop())
      .then((container) => getContainer ? container : this);
  }

  static get requiredData() {
    return {

    };
  }

  createEnvironment(tempDir) {
    ServiceCollection.registerServices(__dirname + "/types/" + this.ann("id"));
    const config = Object.assign({
      env_name: this.name.replace(/[^a-zA-Z]+/g, "").toLowerCase(),
    }, this._config);

    return Environment.create(this.constructor.getEnvConfigurator(), config, this.root)
      .then((env) => {
        this._environment = env;
        this._onEnvironmentSet(env);

        return env;
      })
      .then((env) => {
        return this._onEnvironmentCreated(env, tempDir);
      });
  }

  _onEnvironmentSet(env) {}
  _onEnvironmentCreated(env, tempDir) {}

  getEnvironment() {
    if (!this._environment) {
      ServiceCollection.registerServices(__dirname + "/types/" + this.ann("id"));

      return Environment.load(this.root)
        .then((env) => {
          this._environment = env;
          this._onEnvironmentSet(env);
          return env;
        })
        .catch((err) => {
          throw new Error(`Could not load environment for ${this.name} project.\n` + err);
        });
    }

    return Promise.resolve(this._environment);
  }

  get name() {
    return this._config.name;
  }

  get root() {
    return this._root;
  }

};