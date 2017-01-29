"use strict";

function mustImplement(method) {
  throw `Docker service '${this.constructor.name}' must implement ${method}()`;
}

class DockerService {

  constructor(config) {
    this.config = config || this.defaults();
  }

  configure() {
    return Promise.resolve();
  }

  defaults() {
    mustImplement("defaults");
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
    mustImplement("getKey");
  }

  static getType() {
    return "misc";
  }

  static getLabel() {
    mustImplement("getName");
  }

}

module.exports = DockerService;