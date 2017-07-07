"use strict";

const yaml = require($SRC + "yaml");
const path = require("path");
const fs = require("fs-promise");
const os = require("os");

const aliasManager = require("../../hosts_manager");

const Command = require('../../system/system_command');
const AttachedCommand = require('../attached_command');
const ContainerBase = require('../container_base');
const Template = require('../../template');
const EError = require('../../eerror');

const DOCKER_FILES_DIRNAME = ".docker-files";

/**
 * Container handler for Docker.
 *
 * @Container {
 *  @id "docker",
 *  @filename "docker-compose.yml",
 * }
 */
class DockerContainer extends ContainerBase {

  /**
   * @inheritdoc
   */
  getIp(serviceOrGroupName = "") {
    // Generate the container name for the service or the first from group.
    if (serviceOrGroupName === "") {
      this.env.services.each((service) => {
        serviceOrGroupName += `${this.env.getId()}_${service.ann("id")}_1 `;
      });
    }
    else {
      if (!this.env.services.has(serviceOrGroupName)) {
        let group = this.env.services.ofGroup(serviceOrGroupName);

        if (group === false) {
          throw new EError("No services found in the group: " + serviceOrGroupName);
        }

        serviceOrGroupName = group[Object.keys(group)[0]].ann("id");
      }

      serviceOrGroupName = `${this.env.getId()}_${serviceOrGroupName}_1`;
    }

    let cmd = new Command("docker", [
      "inspect",
      ["-f", '"{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}"'],
      serviceOrGroupName,
    ]);

    return cmd.execute().then((output) => {
      if (output.length < 5) {
        throw new EError("IPs could not be determined. Does the service exist and is the container started?\nCommand: " + cmd);
      }

      let ips = output.split("\n");
      ips.pop();

      if (ips.length === 1) {
        return ips[0];
      }

      let serviceIps = {};
      this.env.services.each((service) => {
        serviceIps[service.ann("id")] = ips.shift();
      });

      return serviceIps;
    });
  }

  /**
   * @inheritDoc
   */
  getNetworkName() {
    return this.env.getId() + "_default";
  }

  /**
   * @inheritdoc
   */
  start() {
    this.directoryToPath();

    return new Command("docker-compose", [
      ["-p", this.env.getId()],
      ["up", "-d"],
    ]).execute().catch((err) => {
      throw new EError("Failed to start environment container.").inherit(err);
    }).then(() => {
      // This provides workaround for windows. By default on linux.sh container
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
            throw new EError("Failed to expose container IPs to hosts on windows.").inherit(err);
          });
      }
    }).then(() => {
      return this.getIp();
    }).then((serviceIps) => {
      let aliases = [];
      // Get the aliases of the services that should be exposed.
      this.env.services.each((service, id) => {
        if (service.ann("aliased")) {
          aliases.push({
            ip: serviceIps[id],
            domain: service.getDomainAlias(),
          });
        }
      });

      // Add aliases to the hosts file.
      return aliasManager.addHosts(aliases).catch((err) => {
        console.warn("Adding host aliases for the service IPs requires admin privileges.");
        console.error(err);
      });
    }).then(() => {return this;});
  }

  /**
   * @inheritDoc
   */
  isStarted() {
    return this.getIp()
      // If we get the IPs we have running containers.
      .then(() => true)
      // If it throws then it couldn't get the IPs because containers are
      // not started.
      .catch(() => false);
  }

  /**
   * @inheritdoc
   */
  stop() {
    this.directoryToPath();

    return new Command("docker-compose", [
      ["-p", this.env.getId()],
      "stop"
    ]).execute()
      .then(() => {return this;})
      .catch((err) => {
        throw new EError("Failed to stop environment container.").inherit(err);
      });
  }

  /**
   * @inheritdoc
   */
  command(command, execOptions = ["exec"], execInService = "web") {
    this.directoryToPath();

    if (execInService === "web") {
      execInService = this.services.ofGroup("web")[0];
    }

    // Make sure the right project name is used with compose
    // as otherwise it will use the directory name which can
    // be customized by the user.
    execOptions.unshift('-p', this.env.getId());

    let cmd = new Command("docker-compose", [
      execOptions, execInService, command,
    ]).inheritStdio();

    return cmd.execute().then(() => this).catch((error) => {
      throw new EError(`Failed to run docker command:\n${cmd.toString()}:\n${error}`);
    });
  }

  /**
   * @inheritdoc
   */
  compose() {
    let composition = {
      version: "2",
      services: {}
    };

    this.env.services.each((Service, id) => {
      composition.services[id] = Service.compose(this.ann("id"));

      if (composition.services[id].volumes) {
        throw new EError(`Services must provide volumes from 'getVolumes()' method. Service '${Service.ann("id")}' added from composition.`);
      }

      composition.services[id].volumes = Service.getVolumes().map((volume) => {
        return (volume.host ? volume.host + ":" : "") + volume.container;
      });
    });

    // Allow services to post react to composition.
    this.env._fireEvent("composedDocker", composition.services);

    return composition;
  }

  /**
   * @inheritdoc
   */
  writeComposition() {
    return new Promise((resolve, reject) => {
      let composition = this.compose();
      let promises = [];

      // Services may provide custom Docker files that are templates. Compile
      // and save these first.
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

  /**
   * Compiles a docker file template.
   *
   * @param {string} serviceId
   *    Service ID.
   * @param args
   *    Data to send to template engine.
   *
   * @returns {Promise}
   * @private
   */
  _compileDockerfile(serviceId, args) {
    const templatePath = path.join(__dirname, "..", "services", serviceId, "Dockerfile.dot");
    const destPath = path.join(this.path, DOCKER_FILES_DIRNAME, serviceId);

    return fs.ensureDir(destPath)
      .then(() => {
        return Template.from(templatePath).compile(args, destPath);
      })
      .catch((err) => {
        throw new EError(`Failed writing Dockerfile for '${serviceId}' service.`).inherit(err);
      });
  }

  /**
   * @inheritdoc
   */
  remove() {
    this.directoryToPath();

    let cmd = new Command("docker-compose", [
      "rm", "-vf",
    ]).inheritStdio();

    return this.stop().then(() => {
        return cmd.execute();
      })
      .then(() => {return this;})
      .catch((err) => {
      throw new EError(`Failed to run docker command:\n ${cmd.toString()}.`).inherit(err);
    });
  }

  /**
   * @inheritDoc
   */
  setFilesGroupOwner() {
    // On windows doesn't make sens.
    // At the moment should only apply to linux.
    if (os.platform() !== "linux") {
      return Promise.resolve();
    }

    // Get the first service that declares group owning.
    let groupService = false;
    this.env.services.each(function (service) {
      if (service.ann("gidName")) {
        groupService = service;
        return false;
      }
    });

    if (!groupService) {
      return Promise.resolve();
    }

    // Set the group owner of all files to the specified group name.
    // We have to do this from the container so that the right GID
    // is used. The user with that name can have different GID.
    return new AttachedCommand(this.env, groupService.ann("id"), "chown", [
      ":" + groupService.ann("gidName"),
      groupService.getProjectMountPath(),
      "-R"
    ]).execute();
  }

}

module.exports = DockerContainer;
