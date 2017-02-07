"use strict";

const utils = require("../utils");
const projectManager = require("./projects_manager");

const Environment = require("../environment/environment");

module.exports = class ProjectBase {

  constructor(projectRoot, config) {
    this.projectRoot = projectRoot;
    this.config = config;
    this.envRoot = projectRoot.substr(0, projectRoot.lastIndexOf("/"));
  }

  static getEnvConfigurator() {
    utils.mustImplement(this, "getEnvConfigurator");
  }

  // Should return a fresh instance of this project.
  static create(mode, args) {

  }

  // Determine whether in the specified directory this type of
  // project can be found.
  static isInDirectory(dir, resolveOnPositive = true) {
    utils.mustImplement(this, "isInDirectory");
  }

  getEnvironment() {
    if (!this.environment) {
      return Environment.load(this.projectRoot).then((env) => {
        this.environment = env;

        return Promise.resolve(env);
      });
    }

    return Promise.resolve(this.environment);
  }

  save() {
    let promise;

    if (this.environment) {
      promise = this.environment.saveConfigTo(this.projectRoot + projectManager.ENV_FILENAME);
    }
    else {
      promise = Promise.resolve();
    }

    return promise.then(() => {
      projectManager.save(this);
    });
  }

  remove() {
    projectManager.remove(this);
  }

};