"use strict";

const inquirer = require("inquirer");
const fs = require("fs-promise");

const utils = require("../utils");

const ProjectStorage = require("./storage");
const Environment = require("../environment/environment");
const ServiceCollection = require("../environment/service_collection");
const OperationCollection = require("../operation_collection");

/**
 * Project base class.
 */
class ProjectBase {

  /**
   * ProjectBase constructor.
   *
   * @param {string} id
   *    ID of the project.
   * @param {string} root
   *    Root directory of the project.
   * @param {Object} config
   *    Configuration data.
   */
  constructor(id, root, config) {
    this._root = root;
    this._key = id;
    this._config = config;
  }

  /**
   * Gathers configuration for a project.
   *
   * @param suggestions
   *    Current config values to build suggestions.
   *
   * @returns {Promise.<Object>}
   *    The project data object.
   */
  static configure(suggestions = {}) {
    let name = null;

    if (suggestions.name) {
      name = suggestions.name.replace(/(_|-)+/g, " ").replace(/[^a-zA-Z0-9 ]+/g, "");
      name = name.charAt(0).toUpperCase() + name.substr(1).toLowerCase();
    }

    console.log();
    console.log("Insert a name for this project. This will be used to generate other required data defaults and as a general human readable identification for the project.".green);

    return inquirer.prompt({
      type: "input",
      name: "name",
      message: "Project name:",
      default: name,
      validate: (value) => value.match(/^[a-zA-Z0-9 ]+$/) ? true : "Project name is required, and can only contain letters, numbers and space.",
      filter: (value) => value.trim()
    });
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

  /**
   * Sets up the project after the environment was created.
   *
   * @returns {Promise}
   */
  setup() {
    this._config.setup = true;
    return this.getEnvironment()
      .then((env) => env.getContainer("docker"))
      // Set the files group owner to the primary one.
      .then((docker) => docker.setFilesGroupOwner())
      .then(() => this.save);
  }

  /**
   * Determine whether the project was already set up.
   *
   * @returns {Promise.<boolean>}
   */
  isSetUp() {
    return this._config.setup;
  }

  /**
   * Saves the project configuration.
   *
   * @returns {Promise}
   */
  save() {
    return ProjectStorage.set(this._key, {
      root: this.root,
      type: this.ann("id"),
      config: this._config
    });
  }

  /**
   * Removes the project from files and storage.
   *
   * @returns {Promise.<ProjectBase>}
   */
  remove() {
    return this.getEnvironment()
      .then((env) => env.remove("docker"))
      .then(() => fs.remove(this.root))
      .then(() => ProjectStorage.remove(this._key))
      .then(() => this);
  }

  /**
   * Starts the environment of the project.
   *
   * @param {boolean} getContainer
   *    Whether to return the container object or self.
   *
   * @returns {Promise.<ContainerBase|ProjectBase>}
   */
  start(getContainer = false) {
    return this.getEnvironment().then((env) => env.getContainer("docker").start())
      .then((container) => getContainer ? container : this);
  }

  /**
   * Stops the environment of the project.
   *
   * @param {boolean} getContainer
   *    Whether to return the container object or self.
   *
   * @returns {Promise.<ContainerBase|ProjectBase>}
  */
  stop(getContainer = false) {
    return this.getEnvironment().then((env) => env.getContainer("docker").stop())
      .then((container) => getContainer ? container : this);
  }

  /**
   * Get environment operations for this specific project.
   *
   * @returns {Promise.<OperationCollection>}
   */
  getOperations() {
    return this.getEnvironment()
      .then((env) => {
        return env.getOperations(this._config.type)
          .setUsageFormat(OperationCollection.formatOptionalStr("project-key", "red") + " {OP_ID}");
      });
  }

  /**
   * Prints information about the project.
   *
   * @returns {Promise.<ProjectBase>}
   */
  printInformation() {
    console.log("-- Project information");
    console.log("- Key : " + this._config.key);
    console.log("- Name : " + this._config.name);
    console.log("- Type : " + this._config.type);
    console.log("- Creation method : " + this._config.creation);

    return this.getEnvironment().then((env) => {
      env.services.each((service) => {
        service.printInformation();
      });
    }).then(() => this);
  }

  /**
   * Creates the environment for the project.
   *
   * @param {string} tempDir
   *    The directory in which the project is.
   *
   * @returns {Promise}
   */
  createEnvironment(tempDir) {
    ServiceCollection.registerServices(__dirname + "/types/" + this.ann("id"));

    return Environment.create(this.key, this.constructor.getEnvConfigurator(), this._config, this.root)
      .then((env) => {
        this._environment = env;
        this._onEnvironmentSet(env);

        return env;
      })
      .then((env) => {
        return this._onEnvironmentCreated(env, tempDir);
      });
  }

  /**
   * Called when the environment was set.
   *
   * @param {Environment} env
   * @private
   */
  _onEnvironmentSet(env) {}

  /**
   * Called when the environment was created.
   *
   * @param {Environment} env
   * @param {string} tempDir
   * @private
   */
  _onEnvironmentCreated(env, tempDir) {}

  /**
   * Gets the project environment.
   *
   * @returns {Promise.<Environment>}
   */
  getEnvironment() {
    if (!this._environment) {
      ServiceCollection.registerServices(__dirname + "/types/" + this.ann("id"));

      return Environment.load(this.key, this._config, this.root)
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

  /**
   * Getter for the project name.
   *
   * @returns {string}
   */
  get name() {
    return this._config.name;
  }

  /**
   * Getter for the project root directory.
   *
   * @returns {string}
   */
  get root() {
    return this._root;
  }

  /**
   * Getter for the project key.
   *
   * @returns {string}
   */
  get key() {
    return this._key;
  }

}

module.exports = ProjectBase;
