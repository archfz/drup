"use strict";

const inquirer  = require("inquirer");
const prompt = inquirer.prompt;
const yaml = require("node-yaml");
const utils = require("../utils");
const fs = require("../fs_utils");

const ServiceCollection = require("./service_collection");

const ENV_FILENAME = "drup-env.yml";

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

    requiredTypes.forEach((type) => {
      let choices = availableServices.typeToChoices(type);
      if (choices.length == 1) {
        addedServices.push(choices[0].value);
      }
      else if (choices.length != 0) {
        questions.push({
          type: 'list',
          name: type,
          message: "Choose " + type.toUpperCase(),
          choices: choices,
        });
      }
    });

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
      let serviceKeys = addedServices.concat(values.additional || []);
      requiredTypes.forEach((type) => {
        values[type] && serviceKeys.push(values[type]);
      });

      let lastPromise;

      serviceKeys.forEach((key) => {
        let Service = new (availableServices.get(key))();
        services.addService(Service);

        if (!lastPromise) {
          lastPromise = Service.configure();
        }
        else {
          lastPromise = lastPromise.then(() => {
            return Service.configure();
          });
        }
      });

      lastPromise.then(() => {
        resolve(new Environment(services, {}));
      }).catch((reason) => {
        console.log(reason);
      });
    });

    return promise;
  }

  static load(path) {
    path = fs.toPath(path);

    let promise = yaml.read(path + ENV_FILENAME).then((data) => {
      let availableServices = ServiceCollection.collect();
      let services = new ServiceCollection();

      for (let [key, serviceConfig] of Object.entries(data.services)) {
        let Service = availableServices.get(key);
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

  save(path) {
    path = fs.toPath(path) || this.path;

    let environment = {
      config: this.config,
      services: {},
    };

    this.services.each((key, service) => {
      environment.services[key] = service.config;
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

  write(containerType, path) {
    let container = this.getContainer(containerType, path);
    let promise = container.write();

    promise.catch((err) => {
      console.log(`Failed writing ${container.constructor.getKey()} container composition: ` + err);
    });

    return promise.then(() => {
      return container;
    });
  }

  getContainer(containerType, path) {
    path = fs.toPath(path);

    let containers = utils.collectModules(__dirname + "/containers", "getKey");

    if (!containers[containerType]) {
      throw "Unknown container type: " + containerType;
    }

    return new containers[containerType](path, this.services, this.config);
  }

}

module.exports = Environment;
