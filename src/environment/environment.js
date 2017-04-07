"use strict";

const inquirer  = require("inquirer");
const yaml = require($SRC + "yaml");
const utils = require("../utils");
const annotatedLoader = require("../ann_loader");
const fs = require("fs-promise");
const path = require("path");

const ServiceCollection = require("./service_collection");

const requiredConfig = {
  env_name: (str) => str.match(/^[a-z]+$/),
};

let containers;

function getContainerTypes() {
  if (!containers) {
    containers = annotatedLoader.collectClasses(__dirname + "/containers", "id");
  }

  return containers;
}

class Environment {

  constructor(envConfig, root) {
    if (!root) {
      throw new Error("Environment root parameter is required.");
    }

    this._servicesInitialized = false;

    this._services = envConfig.services;
    this.config = envConfig.config;
    this.root = root;

    this._listeners = {};
  }

  static create(envConfigurator, config, root) {
    for (const [name, validate] of Object.entries(requiredConfig)) {
      if (!config.hasOwnProperty(name)) {
        throw Error(`'${name}' configuration value is required for environment.`);
      }

      if (!validate(config[name])) {
        throw Error(`'${name}' configuration value is invalid: '${config[name]}'`);
      }
    }

    return envConfigurator.configure().then((services) => {
      return new Environment({
        config: config,
        services: services,
      }, root);
    });
  }

  static load(root) {
    let configPath = root;

    return this.readConfig(configPath)
      .catch((err) => {
        configPath = path.join(root, Environment.DIRECTORIES.PROJECT);
        return this.readConfig(configPath);
      })
      .then((envConfig) => {
        let env = new Environment(envConfig, root);
        env.configFile = path.join(configPath, Environment.FILENAME);

        return env;
      })
      .catch((err) => {
        throw new Error(`Failed instantiating environment from config.\n` + err);
      });
  }

  static readConfig(root) {
    root = path.join(root, Environment.FILENAME);

    return yaml.read(root)
      .catch((err) => {
        throw new Error(`Failed reading environment config:\nPATH: ${root}\n` + err);
      });
  }

  get services() {
    if (this._servicesInitialized) {
      return this._services;
    }
    else {
      this._servicesInitialized = true;
    }

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

    this._services.each((service) => service.bindEnvironment(this));

    this._fireEvent("servicesInitialized", this._services);
    return this._services;
  }

  static hasEnvironment(directory) {
    return fs.exists(path.join(directory, Environment.FILENAME));
  }

  getServiceOperations() {
    let opNames = {};
    let operations = [];

    this.services.each((service) => {
      const serviceOps = service.getOperations();

      if (!Array.isArray(serviceOps)) {
        throw new Error(`Service getOperations() must return array. Service '${service.ann("id")}' did not.`);
      }

      serviceOps.forEach((operation) => {
        if (opNames.hasOwnProperty(operation.name)) {
          throw new Error(`Duplicate service operation name detected: '${operation.name}'.\nDefined by: '${service.ann("id")}' and '${opNames[operation.name]}'.`);
        }

        opNames[operation.name] = service.ann("id");
        operation.service = service.ann("id");
        operations.push(operation);
      });
    });

    return operations;
  }

  runServiceOperation(op, args = []) {
    this.services.get(op.service).runOperation(op.baseName, args);
  }

  save(includeInProject = true) {
    includeInProject = includeInProject ? Environment.DIRECTORIES.PROJECT : "";
    const saveTo = path.join(this.root, includeInProject, Environment.FILENAME);

    let environment = {
      config: this.config,
      services: {},
    };

    this.services.each((service, id) => {
      environment.services[id] = service.config;
    });

    let promise = Promise.resolve();
    if (this.configFile && this.configFile !== saveTo) {
      promise = fs.unlink(this.configFile)
        .catch((err) => {
          throw new Error("Failed removing old environment config file:\n" + err);
        });
    }
    else if(!this.configFile) {
      promise = this._createStructure();
    }

    return promise.then(() => {
        return yaml.write(saveTo, environment);
      })
      .then(() => {
        return this;
      })
      .catch((err) => {
        throw new Error("Failed to save environment configuration.\n" + err);
      });
  }

  composeContainer(containerType) {
    if (containerType == "*") {
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
        throw new Error(`Failed writing ${container.ann("id")} container composition: ` + err);
      });
  }

  getContainer(containerType) {
    let containers = getContainerTypes();

    if (!containers[containerType]) {
      throw new Error("Unknown container type: " + containerType);
    }

    return new containers[containerType](this);
  }

  writeServiceConfigFiles() {
    let promises = [];

    this.services.each((service) => {
      promises.push(service.writeConfigFiles(this.root));
    });

    return Promise.all(promises)
      .catch((err) => {
        throw new Error(`Failed creating configuration files for services.\n` + err);
      });
  }

  remove(containerType) {
    return this.getContainer(containerType).remove();
  }

  _createStructure() {
    return fs.ensureDir(this.root).then(() => {
      return Promise.all(
        Object.keys(Environment.DIRECTORIES).map((dirKey) => {
          return fs.ensureDir(path.join(this.root, Environment.DIRECTORIES[dirKey]));
        })
      );
    });
  }

  _fireEvent(eventType, ...args) {
    if (this._listeners[eventType]) {
      this._listeners[eventType].forEach((callback) => callback(...args));
    }

    return this;
  }

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

Environment.FILENAME = ".drup-env.yml";
Environment.DIRECTORIES = {
  CONFIG: "config",
  DATA: "data",
  LOG: "log",
  PROJECT: "project",
};

module.exports = Environment;
