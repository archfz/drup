"use strict";

const inquirer = require("inquirer");

const utils = require("../utils");

const ProjectStorage = require("./storage");
const Environment = require("../environment/environment");

module.exports = class ProjectBase {

  constructor(root, config) {
    this._root = root;
    this._config = config;
  }

  /**
   * Gets questions for the project configuration.
   *
   * @param suggestions
   *    Suggestion values for the questions.
   *
   * @returns {[*]}
   *    Array of inquirer questions.
   */
  static getConfigureQuestions(suggestions = {}) {
    if (suggestions.name) {
      suggestions.name = suggestions.name.replace(/(_|-)+/g, " ").replace(/[^a-zA-Z0-9 ]+/g, "");
      suggestions.name = suggestions.name.charAt(0).toUpperCase() + suggestions.name.substr(1).toLowerCase();
    }

    return [{
      type: "input",
      name: "name",
      message: "Project name",
      default: suggestions.name,
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
    utils.mustImplement(this, "getInstallationMethods");
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

  start() {

  }

  stop() {

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
    return this._data.name;
  }

  get root() {
    return this._root;
  }

};