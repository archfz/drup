"use strict";

const formatter = require("../terminal-utils/formatter");

const Projects = require("../projects");
const Loader = require("../terminal-utils/async_loader");

module.exports = {
  description : "Start project environment.",
  aliases: ["start", "sta"],
  weight: 100,
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
      loader = new Loader("Starting " + project.name + " ...");

      return project.start().then(() => project);
    }).catch(console.error)
      .then((project) => {
      console.log(project.name + " started!");

      if (loader) {
        loader.destroy();
      }

      return project.getEnvironment();
    })
      .then((env) => {
        console.log("-- Aliased services");
        env.services.each((service) => {
          if (service.ann("aliased")) {
            formatter.list([service.ann("id").green + " : " + service.getDomainAlias()]);
          }
        });
      })
      .catch(console.error);
  }
};