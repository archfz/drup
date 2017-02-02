"use strict";

const fs = require("../fs_utils");
const utils = require("../utils");

module.exports = class ContainerBase {

  constructor(path, serviceCollection, envConfig) {
    this.path = fs.toPath(path);
    this.services = serviceCollection;
    this.config = envConfig;
  }

  getIp(services = "") {
    utils.mustImplement(this, "getIp");
  }

  start() {
    utils.mustImplement(this, "start");
  }

  stop() {
    utils.mustImplement(this, "stop");
  }

  command(command, execOptions = [], execInService = "web") {
    utils.mustImplement(this, "command");
  }

  compose() {
    utils.mustImplement(this, "compose");
  }

  writeComposition() {
    utils.mustImplement(this, "writeComposition");
  }

  exists() {
    if (!this.path) {
      return false;
    }

    return fs.isFile(this.path + this.constructor.getFilename());
  }

  directoryToPath() {
    if (!this.path) {
      throw new Error(`Container without path.`);
    }

    fs.setDirectory(this.path, true);
  }

};