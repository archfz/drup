"use strict";

const utils = require("../utils");

module.exports = class ServiceBase {

  constructor(config) {
    this.config = config || this.constructor.defaults();
  }

  configure() {
    if (!this._configure) {
      return Promise.resolve();
    }

    console.log("\n-- Configure " + this.ann("label"));
    return this._configure();
  }

  compose(containerType, services, envConfig) {
    let fnName = "compose_" + containerType;

    if (typeof this[fnName] !== "function") {
      utils.mustImplement(this, fnName);
    }

    return this[fnName](services, envConfig);
  }

  static defaults() {
    return {};
  }

};
