"use strict";

const yaml = require("node-yaml");

const Command = require('../../system/system_command');
const ContainerBase = require('../container_base');

class DockerContainer extends ContainerBase {

  getIp(serviceName = "") {
    return new Command("sudo docker", [
      "ps",
      "-q",
      ["-f", `'name=${this.config.projectName}_${serviceName}'`],
    ]).execute().then((serviceIds) => {
      if (!serviceIds) {
        return Promise.reject(new Error("Docker container is not started."));
      }

      return new Command("sudo docker", [
        "inspect",
        ["-f", "'{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}'"],
        serviceIds.replace(/(\n|\r)/g, " "),
      ]).execute();

    }).then((output) => {
      let ips = output.split("\n");
      ips.pop();
      return (ips.length == 1 ? ips[0] : ips);
    });
  }

  start() {
    this.directoryToPath();

    let promise = new Command("sudo docker-compose", [
      ["-p", this.config.projectName],
      ["up", "-d"],
    ]).execute().then(() => {return this;});
    promise.catch((error) => {
      throw "Failed to start environment container:\n" + error;
    });

    return promise;
  }

  stop() {
    this.directoryToPath();

    let promise = new Command("sudo docker-compose", ["stop"]).execute()
      .then(() => {return this;});

    promise.catch((error) => {
      throw "Failed to stop environment container:\n" + error;
    });

    return promise;
  }

  command(command, execOptions = [], execInService = "web") {
    this.directoryToPath();

    if (execInService == "web") {
      execInService = this.services.ofType("web")[0];
    }

    let cmd = new Command("sudo docker-compose", [
      "exec", execOptions, execInService, ["bash", "-ci", `"${command}"`],
    ]).execute().then(() => {return this;});

    let promise = cmd.execute();
    promise.catch((error) => {
      throw `Failed to run docker exec:\n${cmd.toString()}:\n${error}`;
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
      composition.services[key] =
        Service.compose(this.constructor.getKey(), this.services, this.config);
    });

    return composition;
  }

  writeComposition(envConfig) {
    return yaml.write(this.path + this.constructor.getFilename(), this.compose());
  }

  static getFilename() {
    return "docker-compose.yml";
  }

  static getKey() {
    return "docker";
  }

}

module.exports = DockerContainer;