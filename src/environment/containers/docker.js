"use strict";

const yaml = require("node-yaml");

const Command = require('../../system/system_command');
const ContainerBase = require('../container_base');

/**
 * @id docker
 * @filename docker-compose.yml
 */
module.exports = class DockerContainer extends ContainerBase {

  getIp(serviceOrGroupName = "") {
    if (serviceOrGroupName === "") {
      this.services.each((service) => {
        serviceOrGroupName += `${this.config.projectName}_${service.ann("id")}_1 `;
      });
    }
    else {
      if (!this.services.has(serviceOrGroupName)) {
        let group = this.services.ofGroup(serviceOrGroupName);

        if (group === false) {
          throw new Error("No services found in the group: " + serviceOrGroupName);
        }

        serviceOrGroupName = group[Object.keys(group)[0]].ann("id");
      }

      serviceOrGroupName = `${this.config.projectName}_${serviceOrGroupName}_1`;
    }

    let cmd = new Command("docker", [
      "inspect",
      ["-f", '"{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}"'],
      serviceOrGroupName,
    ]);

    return cmd.execute().then((output) => {
      if (!output) {
        throw new Error("IPs could not be determined. Does the service exist and is the container started?\nCommand: " + cmd);
      }

      let ips = output.split("\n");
      ips.pop();

      if (ips.length == 1) {
        return ips[0];
      }

      let serviceIps = {};
      this.services.each((service) => {
        serviceIps[service.ann("id")] = ips.shift();
      });

      return serviceIps;
    });
  }

  start() {
    this.directoryToPath();

    return new Command("docker-compose", [
      ["-p", this.config.projectName],
      ["up", "-d"],
    ]).execute().then(() => {return this;}).catch((error) => {
      throw new Error("Failed to start environment container:\n" + error);
    });
  }

  stop() {
    this.directoryToPath();

    return new Command("docker-compose", ["stop"]).execute()
      .then(() => {return this;}).catch((error) => {
        throw new Error("Failed to stop environment container:\n" + error);
      });
  }

  command(command, execOptions = [], execInService = "web") {
    this.directoryToPath();

    if (execInService == "web") {
      execInService = this.services.ofGroup("web")[0];
    }

    let cmd = new Command("docker-compose", [
      "exec", execOptions, execInService, ["bash", "-ci", `"${command}"`],
    ]);

    return cmd.execute().then(() => {return this;}).catch((error) => {
      throw new Error(`Failed to run docker exec:\n${cmd.toString()}:\n${error}`);
    });
  }

  compose() {
    if (!this.services) {
      throw new Error("Cannot compose. No services are configured yet.");
    }

    let composition = {
      version: "2",
      services: {}
    };

    this.services.each((Service, id) => {
      composition.services[id] =
        Service.compose(this.ann("id"), this.services, this.config);
    });

    return composition;
  }

  writeComposition(envConfig) {
    return yaml.write(this.path + this.ann("filename"), this.compose());
  }

};