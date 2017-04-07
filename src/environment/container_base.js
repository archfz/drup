"use strict";

const fs = require("../fs_utils");
const path = require("path");
const utils = require("../utils");

module.exports = class ContainerBase {

  constructor(environment) {
    this.path = path.normalize(environment.root);
    this.env = environment;
  }

  getIp(services = "") {
    utils.mustImplement(this, "getIp");
  }

  start() {
    utils.mustImplement(this, "start");
  }

  /**
   * Determines whether the container is started.
   *
   * @return {Promise.<boolean>}
   *    Is started.
   */
  isStarted() {
    utils.mustImplement(this, "isStarted");
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

  remove() {
    utils.mustImplement(this, "remove");
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