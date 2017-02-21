"use strict";

const Projects = require("../projects");
const Loader = require("../terminal-utils/async_loader");
const cmd = require("../cmd");

module.exports = {
  description : "Remove project and it's environment.",
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
      loader = new Loader("Removing " + project.name + " ...");
      return project.remove();
    }).catch(cmd.error)
      .then(() => loader && loader.destroy());
  }
};