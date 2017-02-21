"use strict";

const Projects = require("../projects");
const Loader = require("../terminal-utils/async_loader");
const cmd = require("../cmd");

module.exports = {
  description : "Start project environment.",
  run : (key = null) => {
    let projectLoad;
    let loader;

    if (key === null) {
      projectLoad = Projects.loadDir(process.cwd());
    }
    else {
      projectLoad = Projects.load(key);
    }

    projectLoad.then((project) => {
      loader = new Loader("Starting " + project.name + " ...");

      return project.start().then(() => project);
    }).catch(cmd.error)
      .then((project) => {
      console.log(project.name + " started!");

      if (loader) {
        loader.destroy();
      }
    });
  }
};