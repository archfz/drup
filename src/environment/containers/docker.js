"use strict";

const yaml = require($SRC + "yaml");
const path = require("path");
const fs = require("fs-promise");
const os = require("os");

const aliasManager = require("../../hosts_manager");

const Command = require('../../system/system_command');
const ContainerBase = require('../container_base');
const Template = require('../../template');

const DOCKER_FILES_DIRNAME = ".docker-files";

/**
 * @id docker
 * @filename docker-compose.yml
 */
module.exports = class DockerContainer extends ContainerBase {

  getIp(serviceOrGroupName = "") {
    if (serviceOrGroupName === "") {
      this.env.services.each((service) => {
        serviceOrGroupName += `${this.env.config.env_name}_${service.ann("id")}_1 `;
      });
    }
    else {
      if (!this.env.services.has(serviceOrGroupName)) {
        let group = this.env.services.ofGroup(serviceOrGroupName);

        if (group === false) {
          throw new Error("No services found in the group: " + serviceOrGroupName);
        }

        serviceOrGroupName = group[Object.keys(group)[0]].ann("id");
      }

      serviceOrGroupName = `${this.env.config.env_name}_${serviceOrGroupName}_1`;
    }

    let cmd = new Command("docker", [
      "inspect",
      ["-f", '"{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}"'],
      serviceOrGroupName,
    ]);

    return cmd.execute().then((output) => {
      if (output.length < 5) {
        throw new Error("IPs could not be determined. Does the service exist and is the container started?\nCommand: " + cmd);
      }

      let ips = output.split("\n");
      ips.pop();

      if (ips.length == 1) {
        return ips[0];
      }

      let serviceIps = {};
      this.env.services.each((service) => {
        serviceIps[service.ann("id")] = ips.shift();
      });

      return serviceIps;
    });
  }

  start() {
    this.directoryToPath();

    return new Command("docker-compose", [
      ["-p", this.env.config.env_name],
      ["up", "-d"],
    ]).execute().catch((error) => {
      throw new Error("Failed to start environment container:\n" + error);
    }).then(() => {
      // This provides workaround for windows. By default on linux container
      // IPs get exposed to hosts. On windows tough docker creates a Hyper-V
      // VM in which it puts the containers, and this VM is private. This is
      // the way to route those IPs to host.
      if (os.platform() === "win32") {
        return this.getIp().then((ips) => {
            return ips[Object.keys(ips)[0]].replace(/(\d+.\d+.)\d+.\d+/, "$10.0");
          })
        // Initially this first command was enough to make it work, but in the
        // newer version docker changed things.
          .then((ip) => new Command("route", [
              ["add", ip],
              ["mask", "255.255.0.0"],
              ["10.0.75.2"] // @ Hyper-V default IP
            ]).execute()
          )
        // The new additional command needs to be run to make sure the upper
        // one actually works.
          .then(() => new Command("docker", [
              "run", "--rm", "-t", "--privileged",
              "--network=none", "--pid=host",
              "justincormack/nsenter1",
              "bin/sh", "-c", "\"iptables -A FORWARD -j ACCEPT\""
            ]).execute()
          ).catch((err) => {
            throw Error("Failed to expose container IPs to hosts on windows.\n" + err);
          });
      }
    }).then(() => {
      return this.getIp();
    }).then((serviceIps) => {
      let aliases = [];
      this.env.services.each((service, id) => {
        if (service.ann("aliased")) {
          aliases.push({
            ip: serviceIps[id],
            domain: service.getDomainAlias(),
          });
        }
      });

      return aliasManager.addHosts(aliases).catch((err) => {
        console.warn("Adding host aliases for the service IPs requires admin privileges.");
        console.error(err);
      });
    }).then(() => {return this;});
  }

  stop() {
    this.directoryToPath();

    return new Command("docker-compose", [
      ["-p", this.env.config.env_name],
      "stop"
    ]).execute()
      .then(() => {return this;})
      .catch((error) => {
        throw new Error("Failed to stop environment container:\n" + error);
      });
  }

  command(command, execOptions = ["exec"], execInService = "web") {
    this.directoryToPath();

    if (execInService == "web") {
      execInService = this.services.ofGroup("web")[0];
    }

    let cmd = new Command("docker-compose", [
      execOptions, execInService, command,
    ]).inheritStdio();

    return cmd.execute().then(() => {return this;}).catch((error) => {
      throw new Error(`Failed to run docker command:\n${cmd.toString()}:\n${error}`);
    });
  }

  compose() {
    let composition = {
      version: "2",
      services: {}
    };

    this.env.services.each((Service, id) => {
      composition.services[id] =
        Service.compose(this.ann("id"));
    });

    this.env._fireEvent("composedDocker", composition.services);

    return composition;
  }

  writeComposition() {
    return new Promise((resolve, reject) => {
      let composition = this.compose();
      let promises = [];

      for (let [serviceId, compost] of Object.entries(composition.services)) {
        if (compost.hasOwnProperty("build")) {
          promises.push(this._compileDockerfile(serviceId, compost.build));
          compost.build = "./" + DOCKER_FILES_DIRNAME + "/" + serviceId;
        }
      }

      Promise.all(promises)
        .then(() => resolve(composition))
        .catch((err) => reject(err));
    }).then((compost) => {
      return yaml.write(path.join(this.path, this.ann("filename")), compost);
    });
  }

  _compileDockerfile(serviceId, args) {
    const templatePath = path.join(__dirname, "..", "services", serviceId, "Dockerfile.dot");
    const destPath = path.join(this.path, DOCKER_FILES_DIRNAME, serviceId);

    return fs.ensureDir(destPath)
      .then(() => {
        return Template.from(templatePath).compile(args, destPath);
      })
      .catch((err) => {
        throw new Error(`Failed writing Dockerfile for '${serviceId}' service:\n` + err);
      });
  }

  remove() {
    this.directoryToPath();

    let cmd = new Command("docker-compose", [
      "rm", "-vf",
    ]).inheritStdio();

    return this.stop().then(() => {
        return cmd.execute();
      })
      .then(() => {return this;})
      .catch((error) => {
      throw new Error(`Failed to run docker command:\n${cmd.toString()}:\n${error}`);
    });
  }

};