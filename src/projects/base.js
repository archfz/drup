"use strict";

const utils = require("../utils");
const projectManager = require("./manager");

const Environment = require("../environment/environment");

module.exports = class ProjectBase {

  constructor(config) {
    this._config = config;
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

  static getInstallationMethods() {
    utils.mustImplement(this, "getInstallationMethods");
  }

  static download(method, toDir) {
    utils.mustImplement(this, "download");
  }

  save() {

  }

  remove() {

  }

  get environment() {
    if (!this._environment) {
      return Environment.load(this.root).then((env) => {
        this._environment = env;
      });
    }

    return Promise.resolve(this._environment);
  }

  get name() {
    return this._config.name;
  }

  get key() {
    return this._config.key;
  }

  get root() {
    return this._config.root;
  }

};