"use strict";

const act = require("./actions");
const Task = require("../task");

let projectTypes = {drupal: require("./drupal")};

module.exports = {

  setupFromDirectory(dir) {

  },

  setupFromGit(repository) {
    return new Task(act.CloneProject)
      .start({
        repository: repository,
      })
      .then((data) => {
        return this.setupFromDirectory(data.get("tmp_directory"));
      })
  },

  setupNew(type, args) {

  },

  getTypes() {
    return projectTypes;
  }

};