"use strict";

const fs = require("../fs_utils");
const utils = require("../utils");

class ContainerBase {

  constructor(path, serviceCollection, envConfig) {
    this.path = fs.toPath(path);
    this.services = serviceCollection;
    this.config = envConfig;
  }

  getIp() {
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

  write() {
    utils.mustImplement(this, "write");
  }

  static getKey() {
    utils.mustImplement(this, "getKey");
  }

  static getFilename() {
    utils.mustImplement(this, "getFilename");
  }

  exists() {
    if (!this.path) {
      return false;
    }

    return fs.isFile(this.path + this.constructor.getFilename());
  }

  directoryToPath() {
    if (!this.path) {
      throw `Container without path.`;
    }

    fs.setDirectory(this.path, true);
  }

}

module.exports = ContainerBase;
