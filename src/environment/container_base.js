"use strict";

const fs = require("../fs_utils");
const path = require("path");
const utils = require("../utils");

/**
 * Base class for containers.
 *
 * @type {ContainerBase}
 */
class ContainerBase {

  /**
   * Container constructor.
   *
   * @param {Environment} environment
   */
  constructor(environment) {
    this.path = path.normalize(environment.root);
    this.env = environment;
  }

  /**
   * Get the ip of a given service or all.
   *
   * @param {string} serviceOrGroupName
   *    Service or service group name.
   *
   * @return {Promise}
   * @resolve {Object|string}
   *    The ip of the service or of the first from the service group. If empty
   *    string provided for parameter then all service IPs keyed by service ID.
   */
  getIp(serviceOrGroupName = "") {
    utils.mustImplement(this, "getIp");
  }

  /**
   * Gets the network name of the environment.
   *
   * @return {string}
   *    The network name.
   */
  getNetworkName() {
    utils.mustImplement(this, "getNetworkName");
  }

  /**
   * Start the container.
   *
   * @return {Promise}
   * @resolve {self}
   */
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

  /**
   * Stop the container.
   *
   * @return {Promise}
   * @resolve {self}
   */
  stop() {
    utils.mustImplement(this, "stop");
  }

  /**
   * Run a command in a given service.
   *
   * @param {string} command
   *    Full command string.
   * @param {Array} execOptions
   *    Additional execute options.
   * @param execInService
   *    The ID of the service to run the command in.
   *
   * @return {Promise}
   * @resolve {self}
   */
  command(command, execOptions = [], execInService = "web") {
    utils.mustImplement(this, "command");
  }

  /**
   * Compose services.
   *
   * @return {Object}
   *    Object containing composition data.
   */
  compose() {
    utils.mustImplement(this, "compose");
  }

  /**
   * Writes composition to file.
   *
   * @return {Promise}
   */
  writeComposition() {
    utils.mustImplement(this, "writeComposition");
  }

  /**
   * Removes the containers.
   *
   * @return {Promise}
   */
  remove() {
    utils.mustImplement(this, "remove");
  }

  /**
   * Checks whether the container composition exists.
   *
   * @returns {Promise.<boolean>}
   *    Whether it exists.
   */
  exists() {
    if (!this.path) {
      return false;
    }

    return fs.isFile(path.join(this.path, this.ann("filename")));
  }

  /**
   * Sets the current working directory to where the composition exists.
   */
  directoryToPath() {
    if (!this.path) {
      throw new Error(`Container without path.`);
    }

    fs.setDirectory(this.path, true);
  }

}

module.exports = ContainerBase;
