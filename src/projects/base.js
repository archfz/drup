"use strict";

const inquirer = require("inquirer");
const fs = require("fs-promise");

const utils = require("../utils");

const ProjectStorage = require("./storage");
const Environment = require("../environment/environment");

module.exports = class ProjectBase {

  constructor(root, key, config) {
    this._root = root;
    this._key = key;
    this._config = config;
  }

  /**
   * Gets questions for the project configuration.
   *
   * @param suggestions
   *    Current config values to build suggestions.
   *
   * @returns {[*]}
   *    Array of inquirer questions.
   */
  static getConfigureQuestions(suggestions = {}) {
    let name = null;

    if (suggestions.name) {
      name = suggestions.name.replace(/(_|-)+/g, " ").replace(/[^a-zA-Z0-9 ]+/g, "");
      name = name.charAt(0).toUpperCase() + name.substr(1).toLowerCase();
    }

    return [{
      type: "input",
      name: "name",
      message: "Project name",
      default: name,
      validate: (value) => value.match(/^[a-zA-Z0-9 ]+$/) ? true : "Project name is required, and can only contain letters, numbers and space.",
    }];
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

  initialize() {
    return Promise.resolve();
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
    return this.environment.getContainer("docker").start()
      .then((container) => getContainer ? container : this);
  }

  stop(getContainer = false) {
    return this.environment.getContainer("docker").stop()
      .then((container) => getContainer ? container : this);
  }

  static get requiredData() {
    return {

    };
  }

  set environment(env) {
    if (!(env instanceof Environment)) {
      throw new Error(`Typeof '${Environment.name}' expected. Got '${typeof env}'.`);
    }

    this._environment = env;
    this._onEnvironmentSet(env);
  }

  _onEnvironmentSet(env) {

  }

  get environment() {
    if (!this._environment) {
      return Environment.load(this.root)
        .then((env) => {
          this._environment = env;
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