"use strict";

function mustImplement(method) {
  throw `Docker service '${this.constructor.name}' must implement ${method}()`;
}

class DockerService {

  constructor(config = {}) {
    this.config = config || this.defaults();
  }

  configure() {
    return this;
  }

  defaults() {
    mustImplement("defaults");
  }

  compose(container) {
    return this.defaults();
  }

  static getKey() {
    mustImplement("getKey");
  }

  static getType() {
    return "misc";
  }

}

exports = DockerService;