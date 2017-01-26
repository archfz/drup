"use strict";

class DockerService {

  constructor(config = {}) {
    this.config = config || this.defaults();
  }

  configure() {
    return false;
  }

  defaults() {

  }

  compose(container) {

  }

  static getKey() {

  }

  static getType() {
    return 'misc';
  }

}

exports = DockerService;