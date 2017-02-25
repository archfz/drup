"use strict";

const Projects = require("../projects");
const Loader = require("../terminal-utils/async_loader");

module.exports = {
  description : "Remove project and it's environment.",
  aliases: ["remove", "rm"],
  weight: 30,
  arguments: [
    {
      name: "key",
      description: "The key of the project.",
      default: "Current directory project.",
      optional: true,
    }
  ],

  execute : (key = null) => {
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
      })
      .catch(console.error)
      .then(() => loader && loader.destroy());
  }
};