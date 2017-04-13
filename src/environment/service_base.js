"use strict";

const utils = require("../utils");
const path = require("path");
const fs = require("fs-promise");

const Template = require("../template");

/**
 * Service base class.
 */
class ServiceBase {

  /**
   * ServiceBase constructor.
   *
   * @param config
   *    The configuration of the service.
   */
  constructor(config) {
    // If no configuration provided use defaults.
    this.config = config || this.constructor.getDefaultConfig();
    this._config_extensions = {};
  }

  /**
   * Gets the default configuration for this service.
   *
   * @returns {Object}
   *    Configuration object.
   */
  static getDefaultConfig() {
    let config = {};

    for (let [key, def] of Object.entries(this.defineConfiguration())) {
      config[key] = def.default;
    }

    return config;
  }

  /**
   * Defines configuration of this service.
   *
   * @returns {Object}
   *    Object keyed by the configuration name having as value an object with:
   *      - label: The label of the configuration.
   *      - default: Default value for the configuration.
   */
  static defineConfiguration() {
    return {};
  }

  /**
   * Getter for the environment to which this service is bound.
   *
   * @returns {Environment}
   */
  get env() {
    if (!this._env) {
      throw new Error("Service not bound to any environment.");
    }

    return this._env;
  }

  /**
   * Gets the operations that this service provides.
   *
   * @returns {Array}
   *    Array of objects that contain:
   *      - baseName: The unique identifier for the operation.
   *      - description: Description of the operation.
   *      - aliases: Aliases that can be used to trigger the operation.
   */
  getOperations() {
    return [];
  }

  /**
   * Gets the domain alias for this service.
   *
   * @returns {string}
   *    Domain alias.
   */
  getDomainAlias() {
    if (!this.ann("aliased")) {
      return false;
    }

    return this.env.config.host_alias + "." + this.ann("id");
  }

  /**
   * Runs operation on this service.
   *
   * @param name
   *    The base name of the operation.
   * @param args
   *    Arguments for the operation.
   *
   * @return {Promise}
   */
  runOperation(name, args) {
    throw new Error(`Service '${this.ann("id")}' does not provide '${name}' operation.`);
  }

  /**
   * Prints information of the service.
   */
  printInformation() {
    if (!Object.keys(this.config).length) {
      return;
    }

    console.log(`-- ${this.ann('label')} info`);

    if (this.ann("aliased")) {
      console.log("Reachable on: " + this.getDomainAlias());
    }

    console.log("- CONTAINER HOSTS ALIAS: \"" + this.ann("id") + "\"");

    for (let [key, def] of Object.entries(this.constructor.defineConfiguration())) {
      console.log(`- ${def.label} : ${JSON.stringify(this.config[key], null, "\t")}`);
    }
  }

  /**
   * Binds environment to this service.
   *
   * @param {Environment} env
   */
  bindEnvironment(env) {
    this._env = env;
  }

  /**
   * Configure service.
   *
   * @returns {Promise}
   */
  configure() {
    if (!this._configure) {
      return Promise.resolve();
    }

    console.log("\n-- Configure " + this.ann("label"));
    return this._configure();
  }

  /**
   * Compose service for give type of container.
   *
   * @param containerType
   *    Container handler ID.
   *
   * @returns {Object}
   *    Object of composition.
   */
  compose(containerType) {
    let fnName = "_compose" + containerType.charAt(0).toUpperCase() + containerType.slice(1);

    if (typeof this[fnName] !== "function") {
      utils.mustImplement(this, fnName);
    }

    return this[fnName]();
  }

  /**
   * Registers configuration file template extension.
   *
   * @param template
   *    The template file path.
   * @param data
   *    The data to send to template engine.
   */
  registerConfigExtension({template, data}) {
    const filename = path.basename(template);
    if (!this._config_extensions[filename]) {
      this._config_extensions[filename] = [];
    }

    this._config_extensions[filename].push({template, data});
  }

  /**
   * Creates and writes the configuration files.
   *
   * @param {string} root
   *    Environment root directory.
   *
   * @returns {Promise}
   */
  writeConfigFiles(root) {
    const configFiles = this._getConfigFileInfo();
    if (configFiles === null) {
      return Promise.resolve();
    }

    const configPath = path.join(__dirname, "services", this.ann("id"), "config");
    const destPath = path.join(root, this._dir("CONFIG"), this.ann("id"));

    let promises = [];
    configFiles.forEach((configInfo) => {
      // Configuration files can be either templates or just simple files.
      if (typeof configInfo === "string") {
        promises.push(
          fs.copy(path.join(configPath, configInfo), destPath)
            .catch((err) => {
              throw new Error(`Failed copying configuration file '${configInfo}' to '${destPath}'\n${err}`);
            })
        );
      }
      else if (typeof configInfo === "object") {
        let {template, definitions, data} = configInfo;

        // Initialize the template.
        let temp = Template.from(path.join(configPath, template)).define(definitions);
        // Add extensions to template if any.
        (this._config_extensions[template] || []).forEach((ext) => temp.extend(ext));
        temp.comment(true, configInfo.commentChar);

        promises.push(temp.compile(data, destPath));
      }
    });

    return Promise.all(promises);
  }

  /**
   * Gets the configuration files information.
   *
   * @returns {Array.<Object|string>|null}
   *    In string format the filename. In object format a template:
   *      - template: The filename.
   *      - definitions: Array of placeholders.
   *      - data: Data to send to template engine.
   * @private
   */
  _getConfigFileInfo() {
    return null;
  }

  /**
   * Gets the directory name of a type.
   *
   * @param {string} type
   *    Key in Environment::DIRECTORIES.
   *
   * @returns {string}
   *    Directory name.
   * @private
   */
  _dir(type) {
    if (!this.env.constructor.DIRECTORIES.hasOwnProperty(type)) {
      throw new Error(`The environment doesn't define the '${type}' type of directory.`);
    }

    return this.env.constructor.DIRECTORIES[type];
  }

}

module.exports = ServiceBase;
