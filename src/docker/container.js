"use strict";

const inquirer  = require("inquirer");
const prompt = inquirer.prompt;

const Command = require("../system/system_command");
const ServiceCollection = require("./service_collection");

let availableServices;

class DockerContainer {

  constructor(pathOrServices = null) {
    if (!pathOrServices) {
      return;
    }

    if (typeof pathOrServices === "string") {
      this.path = pathOrServices;
    }
    else {
      availableServices = ServiceCollection.collect();

      this.services = new ServiceCollection();
      for (let [key, serviceConfig] of Object.entries(pathOrServices)) {
        let Service = availableServices.get(key);
        this.services.addService(new Service(serviceConfig));
      }
    }
  }

  configure() {
    availableServices = ServiceCollection.collect();
    this.services = new ServiceCollection();

    let resolve;
    let promise = new Promise((res, rej) => resolve = res);

    let questions = [{
      type: 'list',
      name: 'web',
      message: 'WEB server',
      choices: availableServices.typeToChoices("web"),
    }, {
      type: 'list',
      name: 'database',
      message: 'DATABASE server',
      choices: availableServices.typeToChoices("database"),
    }];

    let additionalServices = availableServices.notOfTypes(["php", "web", "database"]);
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
      })
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

      lastPromise.then(() => resolve());
    });

    return promise;
  }

  save(path) {
    let composition;

    try {
      composition = this.compose();
    }
    catch (err) {
      throw `Could save docker container. ${err}.`;
    }

    let promise = require("node-yaml").write(path + "/docker-compose.yml", composition);

    promise.then(() => {
      this.path = path;
    }, (error) => {
      throw "Failed to save docker-compose file: " + error;
    });

    return promise;
  }

  compose() {
    if (!this.services) {
      throw "Cannot compose. No services are configured yet.";
    }

    let composition = {
      version: "2",
      services: {}
    };

    this.services.each((key, Service) => {
      composition.services[key] = Service.compose(this);
    });

    return composition;
  }

  start() {
    this.directoryToPath();

    console.log(process.cwd());
    let promise = new Command("sudo docker-compose", ["up", "-d"]).execute();

    promise.then(() => {}, (error) => {
      throw "Failed to start docker container:\n" + error;
    });

    return promise;
  }

  stop() {
    this.directoryToPath();

    let promise = new Command("docker-compose", ["stop"]).execute();

    promise.then(() => {}, (error) => {
      throw "Failed to stop docker container:\n" + error;
    });

    return promise;
  }

  command(command, execOptions = [], execInService = "web service") {
    this.directoryToPath();

    if (execInService == "web service") {
      execInService = this.services.ofType("web")[0];
    }

    let cmd = new Command("docker-compose", [
      "exec", execOptions, execInService, ["bash", "-ci", `"${command}"`],
    ]).execute();

    let promise = cmd.execute();
    promise.then(() => {}, (error) => {
      throw `Failed to run docker exec:\n${cmd.toString()}:\n${error}`;
    });

    return promise;
  }

  directoryToPath() {
    if (!this.path) {
      throw `Container without path.`;
    }

    process.chdir(this.path);
  }

  service(key) {
    this.services.get(key);
  }

}

module.exports = DockerContainer;