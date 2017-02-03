"use strict";

const inquirer  = require("inquirer");
const yaml = require("node-yaml");
const utils = require("../utils");
const fs = require("../fs_utils");

const ServiceCollection = require("./service_collection");

const ENV_FILENAME = "drup-env.yml";

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

  static load(path) {
    path = fs.toPath(path);

    let promise = yaml.read(path + ENV_FILENAME).then((data) => {
      let availableServices = ServiceCollection.collect();
      let services = new ServiceCollection();

      for (let [id, serviceConfig] of Object.entries(data.services)) {
        let Service = availableServices.get(id);
        services.addService(new Service(serviceConfig));
      }

      let env = new Environment(services, data.config);
      env.path = path;

      return env;
    });

    promise.catch((err) => {
      console.log("Failed loading in environment:\n" + err);
    });

    return promise;
  }

  saveConfigTo(path = this.path) {
    if (!this.path && !path) {
      throw new Error("This environment was not saved previously. You must provide a path to save to.");
    }

    path = fs.toPath(path);
    fs.ensureDirectory(path);

    let environment = {
      config: this.config,
      services: {},
    };

    this.services.each((service, id) => {
      environment.services[id] = service.config;
    });

    this.path = path;
    let promise = yaml.write(this.path + ENV_FILENAME, environment);

    promise.catch((err) => {
      console.log("Failed to save environment configuration.\n" + err);
    });

    return promise.then(() => {
      return this;
    });
  }

  composeContainer(containerType, path) {
    let container = this.getContainer(containerType, path);
    let promise = container.writeComposition();

    promise.catch((err) => {
      console.log(`Failed writing ${container.constructor.getKey()} container composition: ` + err);
    });

    return promise.then(() => {
      return container;
    });
  }

  getContainer(containerType, path = this.path) {
    path = fs.toPath(path);

    let containers = utils.collectAnnotated(__dirname + "/containers", "id");

    if (!containers[containerType]) {
      throw new Error("Unknown container type: " + containerType);
    }

    return new containers[containerType](path, this.services, this.config);
  }

};
