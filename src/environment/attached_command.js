"use strict";

const path = require("path");
const os = require("os");

const SystemCommand = require("../system/system_command");

/**
 * Provides command for environment containers.
 * These are good for running executables inside the containers of environments.
 */
class AttachedCommand extends SystemCommand {

  /**
   * Attached command constructor.
   *
   * @param {Environment} environment
   * @param {string} serviceId
   *    The service ID to run executable in.
   * @param {string} executable
   *    The executable name.
   * @param {Array} args
   *    The arguments to pass to executable.
   */
  constructor(environment, serviceId, executable, args) {
    if (!environment.services.has(serviceId)) {
      throw new Error(`Failed to build attached command. Environment does not have service with ID '${serviceId}'.`);
    }

    // Cannot use docker-compose as on windows exec doesn't work.
    super("docker", args);

    this.environment = environment;
    this.dockerArgs = ["exec", "-i"];

    this.asHostUser(true);

    const containerName = environment.services.get(serviceId).getContainerName();
    this.dockerArgs.push(containerName, executable);
  }

  /**
   * Sets whether to execute the container as the hosts UID.
   *
   * @param {boolean} yes
   *   Whether to execute as host UID or default.
   *
   * @return {AttachedCommand}
   */
  asHostUser(yes = true) {
    if (os.platform() !== "linux") {
      return this;
    }

    if (yes) {
      this.dockerArgs.push("--user", "$(id -u)");
    } else {
      const index = this.dockerArgs.indexOf("--user");
      this.dockerArgs.splice(index, 2);
    }

    return this;
  }

  /**
   * @inheritDoc
   */
  getArgumentArray() {
    if (!this._argArray) {
      let dockerArgs = this.dockerArgs;
      dockerArgs.push(this.dockerImage);
      this._argArray = dockerArgs.concat(super.getArgumentArray());
    }

    return this._argArray;
  }

  /**
   * @inheritdoc
   */
  execute(inDir = null) {
    const currentDir = process.cwd();
    process.chdir(this.environment.root);

    return super.execute()
      .then((output) => {
        process.chdir(currentDir);
        return output;
      });
  }

}

module.exports = AttachedCommand;