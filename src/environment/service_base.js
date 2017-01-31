"use strict";

const utils = require("../utils");

class DockerService {

  constructor(config) {
    this.config = config || this.defaults();
  }

  configure() {
    return Promise.resolve();
  }

  defaults() {
    utils.mustImplement(this, "defaults");
  }

  compose(container) {
    return this.defaults();
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