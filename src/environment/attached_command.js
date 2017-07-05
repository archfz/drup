"use strict";

const path = require("path");
const os = require("os");

const SystemCommand = require("../system/system_command");

class AttachedCommand extends SystemCommand {

  constructor(environment, serviceId, executable, args) {
    if (!environment.services.has(serviceId)) {
      throw new Error(`Failed to build attached command. Environment does not have service with ID '${serviceId}'.`);
    }

    super("docker-compose", args);

    this.environment = environment;
    this.dockerArgs = ["exec"];

    if (os.platform() === "linux") {
      this.dockerArgs.push("--user", "$(id -u)");
    }

    this.dockerArgs.push(serviceId, executable);
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
