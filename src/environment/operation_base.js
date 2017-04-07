"use strict";

const utils = require("../utils");
const annotations = require("../annotations");

const SystemCommand = require("../system/system_command");
const Environment = require("environment");

class OperationBase extends SystemCommand {

  constructor(directory, args) {

    super("docker", args);
  }

  static initCustom(directory, args) {
    return new this.constructor(directory, args);
  }

  static initOnEnvironment(environment, volumeFrom) {
    if (!(environment instanceof Environment)) {
      throw new Error(`Environment expected. Got '${typeof Environment}'.`);
    }

    if (!volumeFrom) {
      throw new Error("You must specify from which service to take files.");
    }

    return environment.getContainer("docker")
      .then((docker) => docker.start())
      .then((docker) => {

      })

    let volume = environment.services.get(volumeFrom);
  }

}

module.exports = OperationBase;
