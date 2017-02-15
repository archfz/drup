"use strict";

const yaml = require("node-yaml");
const path = require("path");
const fs = require("fs-promise");

const utils = require("../utils");
const globals = require("../globals");

const ProjectBase = require("./base");

let _storage;
function getStorage() {
  if (_storage) {
    return Promise.resolve(_storage);
  }

  return fs.exists(Projects.STORAGE_FILE)
    .then((exists) => {
      if (!exists) {
        return Promise.resolve({});
      }

      return yaml.read(Projects.STORAGE_FILE)
        .catch((err) => {
          throw new Error(`Failed loading in project storage file:\nFILE: ${Projects.STORAGE_FILE}\n` + err);
        });
    })
    .then((data) => {
      _storage = data;
      return data;
    });
}

let projectTypes;
function getProjectTypes() {
  if (!projectTypes) {
    projectTypes = utils.collectAnnotated(__driname, "id", true);
  }

  return projectTypes;
}

class Projects {

  static create() {

  }

  static register(directory) {

  }

  static clone(repository) {

  }

  static types() {

  }

  static loadByDirectory(dir) {

  }

  static list() {

  }

  static listByType(type) {

  }

}

Projects.STORAGE_FILE = path.join(globals.GLOBAL_STORE_ROOT, "projects.yml");

module.exports = Projects;
