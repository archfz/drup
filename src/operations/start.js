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

  execute : function (key = null) {
    let projectLoad;

    if (key === null) {
      projectLoad = Projects.loadDir(process.cwd());
    }
    else {
      projectLoad = Projects.load(key);
    }

    projectLoad.then((project) => {
      let startLoader = new Loader("Starting " + project.name + " ...");

      let setupPromise = this.ensureProjectSetUp(project);
      let startPromise = project.start().then(() => {
        startLoader.finish();
        return project;
      });

      return Promise.all([setupPromise, startPromise]);
    })
    .catch(console.error)
    .then(([,project]) => {
      console.log(project.name + " started!");
      return project.getEnvironment()
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
  },

  ensureProjectSetUp(project) {
    if (project.isSetUp()) {
      return Promise.resolve();
    }

    let setupLoader = new Loader("Setting up project");
    return project.setup().then(() => setupLoader.finish());
  }

};