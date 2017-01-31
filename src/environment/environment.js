"use strict";

const inquirer  = require("inquirer");
const prompt = inquirer.prompt;
const yaml = require("node-yaml");
const utils = require("../utils");
const fs = require("../fs_utils");

const ServiceCollection = require("./service_collection");

const ENV_FILENAME = "drup-env.json";

class Environment {

  constructor(services, config) {
    this.services = services;
    this.config = config;
  }

  static create(requiredTypes = [], restrictedTypes = []) {
    let availableServices = ServiceCollection.collect();
    let services = new ServiceCollection();

    let resolve;
    let promise = new Promise((res, rej) => resolve = res);

    let questions = [];
    let addedServices = [];

    for (let type in requiredTypes) {
      let choices = availableServices.typeToChoices(type);
      if (choices.length == 1) {
        addedServices.push(type);
      }
      else if (choices.length != 0) {
        questions.push({
          type: 'list',
          name: type,
          message: "Choose " + type.toUpperCase(),
          choices: choices,
        });
      }
    }

    let additionalServices = availableServices.notOfTypes(requiredTypes.concat(restrictedTypes));
    if (additionalServices) {
      let choices = [];

      for (let [type, services] of Object.entries(additionalServices)) {
        choices.push(new inquirer.Separator(`-- ${type}:`));
        for (let [key, service] of Object.entries(services)) {
          choices.push({value: key, name: service.getLabel()});
        }
      }

      questions.push({
        type: 'checkbox',
        name: 'additional',
        message: 'Select additional services',
        choices: choices
      });
    }

    prompt(questions).then((values) => {
      let serviceKeys = values.additional || [];
      serviceKeys.push("php", values.web, values.database);

      let lastPromise;

      serviceKeys.forEach((key) => {
        let Service = new (availableServices.get(key))();
        this.services.addService(Service);

        if (!lastPromise) {
          lastPromise = Service.configure();
        }
        else {
          lastPromise = lastPromise.then(Service.configure());
        }
      });

      lastPromise.then(() => resolve()).catch((reason) => {
        console.log(reason);
      });
    });

    return promise;
  }

  static load(path) {
    path = fs.toPath(path);

    let environment = yaml.read(path + ENV_FILENAME);
    let availableServices = ServiceCollection.collect();
    let services = new ServiceCollection();

    for (let [key, serviceConfig] of Object.entries(environment.services)) {
      let Service = availableServices.get(key);
      services.addService(new Service(serviceConfig));
    }

    this.path = path;
    return new Environment(services, environment.config);
  }

  save(path) {
    path = fs.toPath(path) || this.path;

    let environment = {
      config: this.config,
      services: {},
    };

    this.services.each((service) => {
      environment.services[service.getKey()] = service.config;
    });

    this.path = path;
    let promise = yaml.write(this.path + ENV_FILENAME);

    promise.catch((err) => {
      console.log("Failed to save environment configuration.\n" + err);
    });

    return promise;
  }

  write(containerType, path) {
    let container = this.getContainer(containerType, path);
    let promise = container.write().then(() => {
      return container;
    });

    promise.catch((err) => {
      console.log(`Failed writing ${container.constructor.name} container composition: ` + err);
    });

    return promise;
  }

  getContainer(containerType, path) {
    path = fs.toPath(path);

    let containers = utils.collectModules(__dirname + "/containers", "getKey");

    if (!containers[containerType]) {
      throw "Unknown container type: " + containerType;
    }

    let container = new containers[containerType](path, this.services);
  }

}

module.exports = Environment;
