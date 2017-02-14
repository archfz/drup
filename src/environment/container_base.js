"use strict";

const fs = require("../fs_utils");
const path = require("path");
const utils = require("../utils");

module.exports = class ContainerBase {

  constructor(containerPath) {
    this.path = path.normalize(containerPath);
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

    return fs.isFile(path.join(this.path, this.ann("filename")));
  }

  directoryToPath() {
    if (!this.path) {
      throw new Error(`Container without path.`);
    }

    fs.setDirectory(this.path, true);
  }

};