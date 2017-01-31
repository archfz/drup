"use strict";

const utils = require("../utils");

class DockerService {

  constructor(config) {
    this.config = config || this.constructor.defaults();
  }

  configure() {
    return Promise.resolve();
  }

  compose(containerType, envConfig) {
    let fnName = "compose_" + containerType;

    if (typeof this[fnName] !== "function") {
      utils.mustImplement(this, fnName);
    }

    return this[fnName](envConfig);
  }

  write(envConfig) {
    utils.mustImplement(this, "write");
  }

  getKey() {
    return this.constructor.getKey();
  }

  getType() {
    return this.constructor.getType();
  }

  getLabel() {
    return this.constructor.getLabel();
  }

  static defaults() {
    return {};
  }

  static getKey() {
    utils.mustImplement(this, "getKey");
  }

  static getType() {
    return "misc";
  }

  static getLabel() {
    utils.mustImplement(this, "getName");
  }

}

module.exports = DockerService;
