"use strict";

const inquirer  = require("inquirer");
const yaml = require($SRC + "yaml");
const utils = require("../utils");
const annotatedLoader = require("../ann_loader");
const fs = require("fs-promise");
const path = require("path");

const ServiceCollection = require("./service_collection");
const OperationCollection = require("../operation_collection");

const EError = require("../eerror");

// Required configuration keys with validation function.
const requiredConfig = {

};

/**
 * Contains available container handlers.
 * @type {ContainerBase[]}
 */
let containers;

/**
 * Collects and returns the available containers.
 *
 * @returns {ContainerBase[]}
 */
function getContainerTypes() {
  if (!containers) {
    containers = annotatedLoader.collectClasses(__dirname + "/containers", "Container","id");
  }

  return containers;
}

/**
 * Environment handler class.
 */
class Environment {

  /**
   * Environment constructor.
   *
   * @param {string} id
   *    The environment unique ID.
   * @param {Object} servicesConfig
   *    Available services with their configurations.
   * @param {Object} config
   *    Configuration like 'host_alias' and other that will
   *    be added to the env file.
   * @param {string} root
   *    The root directory of the environment.
   */
  constructor(id, servicesConfig, config, root) {
    if (!root) {
      throw new Error("Environment root parameter is required.");
    }

    // Make sure this ID is as simple as possible and it still
    // complies to docker compose container prefix.
    if (!id.match(/^[a-z][a-z0-9]*$/)) {
      throw new Error(`Malformed environment ID: '${id}'`);
    }

    this._servicesInitialized = false;

    this._services = servicesConfig;
    this._id = id;
    this.config = config;
    this.root = root;

    this._listeners = {};
  }

  /**
   * Create new environment configuration.
   *
   * @param {string} id
   *    ID of the environment.
   * @param {EnvironmentConfigurator} envConfigurator
   *    Service configurator.
   * @param {Object} config
   *    Additional config to be stored with environment.
   * @param {string} root
   *    The root directory for the environment.
   *
   * @returns {Promise.<Environment>}
   * @resolve {Environment}
   */
  static create(id, envConfigurator, config, root) {
    // Validate required additional configuration.
    for (const [name, validate] of Object.entries(requiredConfig)) {
      if (!config.hasOwnProperty(name)) {
        throw Error(`'${name}' configuration value is required for environment.`);
      }

      if (!validate(config[name])) {
        throw Error(`'${name}' configuration value is invalid: '${config[name]}'`);
      }
    }

    // Configure and create the environment object.
    return envConfigurator.configure().then((services) => {
      return new Environment(id, services, config, root);
    });
  }

  /**
   * Load environment from configuration.
   *
   * @param {string} id
   *    ID of the environment.
   * @param {Object} config
   *    The environment config.
   * @param {string} root
   *    Root directory of the environment.
   *
   * @returns {Promise.<Environment>}
   * @resolve {Environment}
   */
  static load(id, config, root) {
    let configPath = root;

    // Try to read from root.
    return this.readConfig(configPath)
    // If failed to read from root try to read from root/project as the user
    // may choose to save in root or under the project to include in repo.
      .catch((err) => {
        // Other errors can happen, but we are only handling the not found.
        if (err.code !== "ENOENT") {
          throw err;
        }

        configPath = path.join(root, Environment.DIRECTORIES.PROJECT);
        return this.readConfig(configPath);
      })
      .then((envConfig) => {
        let env = new Environment(id, envConfig.services, config, root);
        env.configFile = path.join(configPath, Environment.FILENAME);
        // In case we load in an environment we should never override it's
        // default configurations. To do so save the default config and
        // when saving check for these.
        env.configDefault = envConfig.config;

        return env;
      })
      .catch((err) => {
        throw new EError(`Failed instantiating environment from config.`).inherit(err);
      });
  }

  /**
   * Reads the environment configuration.
   *
   * @param root
   *    Root directory of the environment.
   *
   * @returns {Promise.<Object>}
   * @resolve {Object}
   *    Environment configuration object.
   */
  static readConfig(root) {
    root = path.join(root, Environment.FILENAME);

    return yaml.read(root)
      .catch((err) => {
        throw new EError(`Failed reading environment config:\nPATH: ${root}`).inherit(err);
      });
  }

  /**
   * Getter for the services.
   *
   * Provides lazy loading of the services classes.
   *
   * @returns {ServiceCollection}
   *    All the configured services.
   */
  get services() {
    // If the services were already initialized we are done.
    if (this._servicesInitialized) {
      return this._services;
    }
    else {
      this._servicesInitialized = true;
    }

    // Services might be instantiated if we just got them from the configurator.
    // In that case prevent re-instantiation.
    if (!(this._services instanceof ServiceCollection)) {
      const availableServices = ServiceCollection.collect();
      const services = new ServiceCollection();

      for (let [id, serviceConfig] of Object.entries(this._services)) {
        const Service = availableServices.get(id);
        const service = new Service(serviceConfig);

        services.addService(service);
      }
      this._services = services;
    }

    // Bind this environment to the services.
    this._services.each((service) => service.bindEnvironment(this));

    this._fireEvent("servicesInitialized", this._services);
    return this._services;
  }

  /**
   * Check whether a directory has environment configuration.
   *
   * @param {string} directory
   *    The directory to check in.
   */
  static hasEnvironment(directory) {
    return fs.exists(path.join(directory, Environment.FILENAME));
  }

  /**
   * Get the ID of the environment.
   *
   * @returns {string}
   */
  getId() {
    return this._id;
  }

  /**
   * Gets service operations and detached operations.
   *
   * @param {string} projectType
   *    The type of project for which to get the operations.
   *
   * @return {OperationCollection}
   */
  getOperations(projectType) {
    // Get detached environment operations.
    const operations = new OperationCollection("Environment specific operations", __dirname + "/operations")
      .addPredefinedArgument(this);

    // Add all service operations.
    this.services.each((service, id) => {
      let dir = __dirname + "/services/" + id + "/operations";

      if (fs.existsSync(dir)) {
        operations.addFrom(dir);
      }
    });

    // Filter out project specific operations.
    return operations.filter((operation) => {
      return !operation.ann("types") || operation.ann("types").split(/[,.;\s]+/).includes(projectType);
    });
  }

  /**
   * Gets the primary mount directory of the project.
   *
   * @return {string|boolean}
   *   The path to the primary mount in containers otherwise false if none.
   */
  getProjectMountDirectory() {
    const web = this.services.firstOfGroup("web");
    if (web) {
      return web.getProjectMountPath();
    }

    return false;
  }

  /**
   * Save the environment configuration.
   *
   * @param includeInProject
   *    Whether to include the configuration in the project directory.
   *
   * @returns {Promise.<Environment>}
   * @resolve {self}
   */
  save(includeInProject = true) {
    includeInProject = includeInProject ? Environment.DIRECTORIES.PROJECT : "";
    const saveTo = path.join(this.root, includeInProject, Environment.FILENAME);

    let environment = {
      // Set the default configuration. If no default is available this
      // is a new environment, in that case the defaults will be the
      // current ones.
      config: this.configDefault || this.config,
      services: {},
    };

    this.services.each((service, id) => {
      environment.services[id] = service.config;
    });

    let promise = Promise.resolve();
    // Check if location of the configuration was just changed.
    if (this.configFile && this.configFile !== saveTo) {
      promise = fs.unlink(this.configFile)
        .catch((err) => {
          throw new EError("Failed removing old environment config file.").inherit(err);
        });
    }
    // If this is a new environment first create the directory structure.
    else if(!this.configFile) {
      promise = this._createStructure();
    }

    return promise.then(() => yaml.write(saveTo, environment))
      .catch((err) => {
        throw new EError("Failed to save environment configuration.").inherit(err);
      })
      .then(() => this);
  }

  /**
   * Compose all or one container.
   *
   * @param {string} containerType
   *    Container handler ID. "*" will compose all containers.
   *
   * @returns {Promise.<ContainerBase|ContainerBase[]>}
   * @resolve {ContainerBase|ContainerBase[]}
   *    Container handler.
   */
  composeContainer(containerType) {
    if (containerType === "*") {
      let promises = [];

      for (let [, Container] of Object.entries(getContainerTypes())) {
        let cont = new Container(this);
        promises.push(cont.writeComposition());
      }

      return Promise.all(promises);
    }

    let container = this.getContainer(containerType);
    let promise = container.writeComposition();

    return promise.then(() => {
        return container;
      }).catch((err) => {
        throw new EError(`Failed writing "${container.ann("id")}" container composition.`).inherit(err);
      });
  }

  /**
   * Get container handler for this environment.
   *
   * @param containerType
   *    Container handler ID.
   *
   * @returns {ContainerBase}
   */
  getContainer(containerType) {
    let containers = getContainerTypes();

    if (!containers[containerType]) {
      throw new Error(`Unknown container type: "${containerType}"`);
    }

    return new containers[containerType](this);
  }

  /**
   * Writes service configuration files.
   *
   * @returns {Promise}
   */
  writeServiceConfigFiles() {
    let promises = [];

    this.services.each((service) => {
      promises.push(service.writeConfigFiles(this.root));
    });

    return Promise.all(promises)
      .catch((err) => {
        throw new EError(`Failed creating configuration files for services.`).inherit(err);
      });
  }

  remove(containerType) {
    return this.getContainer(containerType).remove();
  }

  /**
   * Creates environment directory structure under root.
   *
   * @returns {Promise}
   * @private
   */
  _createStructure() {
    return fs.ensureDir(this.root).then(() => {
      return Promise.all(
        Object.keys(Environment.DIRECTORIES).map((dirKey) => {
          return fs.ensureDir(path.join(this.root, Environment.DIRECTORIES[dirKey]));
        })
      );
    });
  }

  /**
   * Fires an environment event.
   *
   * @param {string} eventType
   *    Event identifier.
   * @param {Array} args
   *
   * @returns {Environment}
   * @private
   */
  _fireEvent(eventType, ...args) {
    if (this._listeners[eventType]) {
      this._listeners[eventType].forEach((callback) => callback(...args));
    }

    return this;
  }

  /**
   * Register event listener.
   *
   * @param {string} eventType
   *    Event identifier.
   * @param {Function} callback
   *    Callback function.
   *
   * @returns {Environment}
   */
  on(eventType, callback) {
    if (typeof callback !== "function") {
      throw new Error("Callback must be a function.");
    }

    if (!this._listeners[eventType]) {
      this._listeners[eventType] = [];
    }

    this._listeners[eventType].push(callback);
    return this;
  }

}

// Environment configuration filename.
Environment.FILENAME = ".drup-env.yml";
// Directory names for the main structure.
Environment.DIRECTORIES = {
  CONFIG: "config",
  DATA: "data",
  LOG: "log",
  PROJECT: "project",
};

module.exports = Environment;
