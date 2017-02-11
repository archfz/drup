"use strict";

const inquirer  = require("inquirer");
const yaml = require("node-yaml");
const utils = require("../utils");
const fs = require("../fs_utils");
const path = require("path");

const ServiceCollection = require("./service_collection");

const requiredConfig = {
  env_name: (str) => str.match(/^[a-z_]+$/),
};

let containers;

function getContainers() {
  if (!containers) {
    containers = utils.collectAnnotated(__dirname + "/containers", "id");
  }

  return containers;
}

module.exports = class Environment {

  constructor(services, config) {
    this.services = services;
    this.config = config;
  }

  static create(envConfigurator, config) {
    for (const [name, validate] of Object.entries(requiredConfig)) {
      if (!config.hasOwnProperty(name)) {
        throw Error(`'${name}' configuration value is required for environment.`);
      }

      if (!validate(config[name])) {
        throw Error(`'${name}' configuration value is invalid.`);
      }
    }

    return envConfigurator.configure().then((services) => {
      return new Environment(services, config);
    });
  }

  static load(configFileOrData) {
    let promise, configFile;
    if (typeof configFileOrData === "object") {
      promise = Promise.resolve(configFileOrData);
    }
    else {
      configFile = configFileOrData;
      promise = yaml.read(configFile);
    }

    promise = promise.then((data) => {
      let availableServices = ServiceCollection.collect();
      let services = new ServiceCollection();

      for (let [id, serviceConfig] of Object.entries(data.services)) {
        let Service = availableServices.get(id);
        services.addService(new Service(serviceConfig));
      }

      let env = new Environment(services, data.config);
      env.configFile = configFile;

      return env;
    });

    promise.catch((err) => {
      throw new Error("Failed loading in environment:\n" + err);
    });

    return promise;
  }

  saveConfigTo(configFile = this.configFile) {
    if (!this.configFile && !configFile) {
      throw new Error("This environment was not saved previously. You must provide a config file path to save to.");
    }

    let environment = {
      config: this.config,
      services: {},
    };

    this.services.each((service, id) => {
      environment.services[id] = service.config;
    });

    fs.ensureDirectory(path.dirname(configFile));
    let promise = yaml.write(configFile, environment);

    promise.catch((err) => {
      throw new Error("Failed to save environment configuration.\n" + err);
    });

    this.configFile = configFile;
    return promise.then(() => {
      return this;
    });
  }

  composeContainer(containerType, path) {
    if (containerType == "*") {
      let promises = [];

      for (let [, Container] of Object.entries(getContainers())) {
        let cont = new Container(path, this.services, this.config);
        promises.push(cont.writeComposition());
      }

      return Promise.all(promises);
    }

    let container = this.getContainer(containerType, path);
    let promise = container.writeComposition();

    promise.catch((err) => {
      throw new Error(`Failed writing ${container.constructor.getKey()} container composition: ` + err);
    });

    return promise.then(() => {
      return container;
    });
  }

  getContainer(containerType, path = path.dirname(this.configFile)) {
    let containers = getContainers();

    if (!containers[containerType]) {
      throw new Error("Unknown container type: " + containerType);
    }

    return new containers[containerType](path, this.services, this.config);
  }

};
