"use strict";

const Command = require("/src/system/system_command");

let availableServices = null;

function configureContainer() {

}

function discoverServices() {
  if (availableServices) {
    return;
  }

  availableServices = {};

  require("fs").readdirSync(__dirname + "/services").forEach(function(file) {
    let Service = require("./services/" + file);
    availableServices[Service.key()] = Service;
  });
}

class DockerContainer {

  constructor(path = null, servicesConfig = null) {
    if (path) {
      this.path = path;
      return;
    }

    discoverServices();

    if (!servicesConfig) {
      this.services = configureContainer();
    }
    else {
      servicesConfig.forEach((service, key) => {
        this.services[key] = new availableServices[key](service);
      });
    }
  }

  save(path) {
    let promise = require("node-yaml").write(path + "/docker-compose.yml", this.compose());

    promise.then(() => {
      this.path = path;
    }, (error) => {
      throw "Failed to save docker-compose file: " + error;
    });

    return promise;
  }

  compose() {
    let composition = {
      version: "2",
      services: {}
    };

    for (let [key, Service] of Object.entries(this.services)) {
      composition.services[key] = Service.compose(this);
    }

    return composition;
  }

  start() {
    let promise = new Command("docker-compose", [["start"]]).execute();

    promise.then(() => {}, (error) => {
      throw "Failed to start docker container: " + error;
    });

    return promise;
  }

  stop() {
    let promise = new Command("docker-compose", [["stop"]]).execute();

    promise.then(() => {}, (error) => {
      throw "Failed to stop docker container: " + error;
    });

    return promise;
  }

  command() {
    let promise = new Command("docker-compose", [["stop"]]).execute();

    promise.then(() => {}, (error) => {
      throw "Failed to stop docker container: " + error;
    });

    return promise;
  }

  service(type) {

  }

}