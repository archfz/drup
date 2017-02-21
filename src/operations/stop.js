"use strict";

const Projects = require("../projects");
const Loader = require("../terminal-utils/async_loader");
const cmd = require("../cmd");

module.exports = {
  description : "Stop project environment.",
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
      loader = new Loader("Stopping " + project.name + " ...");

      return project.stop().then(() => project);
    }).catch(cmd.error)
      .then((project) => {
        console.log(project.name + " stopped!");

        if (loader) {
          loader.destroy();
        }
      });
  }
};