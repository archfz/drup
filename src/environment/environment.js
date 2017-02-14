"use strict";

const inquirer  = require("inquirer");
const yaml = require("node-yaml");
const utils = require("../utils");
const fs = require("fs-promise");
const path = require("path");

const ServiceCollection = require("./service_collection");

const requiredConfig = {
  env_name: (str) => str.match(/^[a-z_]+$/),
};

let containers;

function getContainerTypes() {
  if (!containers) {
    containers = utils.collectAnnotated(__dirname + "/containers", "id");
  }

  return containers;
}

class Environment {

  constructor(envConfig, root) {
    this._servicesInitialized = false;

    this._services = envConfig.services;
    this.config = envConfig.config;
    this.root = root;
  }

  static create(envConfigurator, config, root) {
    for (const [name, validate] of Object.entries(requiredConfig)) {
      if (!config.hasOwnProperty(name)) {
        throw Error(`'${name}' configuration value is required for environment.`);
      }

      if (!validate(config[name])) {
        throw Error(`'${name}' configuration value is invalid.`);
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
    let configFile = path.join(root, Environment.FILENAME);

    return yaml.read(configFile)
      .catch((err) => {
        configFile = path.join(root, Environment.DIRECTORIES.PROJECT, Environment.FILENAME);
        return yaml.read(configFile);
      })
      .catch((err) => {
        throw new Error(`Failed loading in environment config:\nPATH: ${configFile}\n` + err);
      })
      .then((envConfig) => {
        let env = new Environment(envConfig, root);
        env.configFile = configFile;

        return env;
      })
      .catch((err) => {
        throw new Error(`Failed instantiating environment from config.\n` + err);
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
        service.bindEnvironment(this);

        services.addService(service);
      }

      this._services = services;
    }
    else {
      this._services.each((service) => service.bindEnvironment(this));
    }

    return this._services;
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

  addServiceConfigFiles() {
    let promises = [];

    this.services.each((service) => {
      promises.push(service.addConfigFiles(this.root));
    });

    return Promise.all(promises)
      .catch((err) => {
        throw new Error(`Failed creating configuration files for services.\n` + err);
      });
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

}

Environment.FILENAME = ".drup-env.yml";
Environment.DIRECTORIES = {
  CONFIG: "config",
  DATA: "data",
  LOG: "log",
  PROJECT: "project",
};

module.exports = Environment;
