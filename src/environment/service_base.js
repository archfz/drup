"use strict";

const utils = require("../utils");

module.exports = class ServiceBase {

  constructor(config) {
    this.config = config || this.constructor.defaults();
  }

  configure() {
    return Promise.resolve();
  }

  compose(containerType, services, envConfig) {
    let fnName = "compose_" + containerType;

    if (typeof this[fnName] !== "function") {
      utils.mustImplement(this, fnName);
    }

    return this[fnName](services, envConfig);
  }

  write(envConfig) {
    utils.mustImplement(this, "write");
  }

  static defaults() {
    return {};
  }

};
