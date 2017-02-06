"use strict";

const inquirer  = require("inquirer");
const yaml = require("node-yaml");
const utils = require("../utils");
const fs = require("../fs_utils");

const ServiceCollection = require("./service_collection");

module.exports = class Environment {

  constructor(services, config) {
    this.services = services;
    this.config = config;
  }

  static create(envConfigurator, additionalConfig = {projectName: "test"}) {
    return envConfigurator.configure().then((services) => {
      return new Environment(services, additionalConfig);
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

    fs.ensureDirectory(this.getConfigPath());

    let environment = {
      config: this.config,
      services: {},
    };

    this.services.each((service, id) => {
      environment.services[id] = service.config;
    });

    this.configFile = configFile;
    let promise = yaml.write(this.configFile, environment);

    promise.catch((err) => {
      throw new Error("Failed to save environment configuration.\n" + err);
    });

    return promise.then(() => {
      return this;
    });
  }

  composeContainer(containerType, path) {
    let container = this.getContainer(containerType, path);
    let promise = container.writeComposition();

    promise.catch((err) => {
      throw new Error(`Failed writing ${container.constructor.getKey()} container composition: ` + err);
    });

    return promise.then(() => {
      return container;
    });
  }

  getContainer(containerType, path = this.getConfigPath()) {
    let containers = utils.collectAnnotated(__dirname + "/containers", "id");

    if (!containers[containerType]) {
      throw new Error("Unknown container type: " + containerType);
    }

    return new containers[containerType](path, this.services, this.config);
  }

  getConfigPath() {
    let pathParts = this.configFile.split("/");
    pathParts.pop();
    return pathParts.join("/");
  }

};
