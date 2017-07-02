"use strict";

const formatter = require("../terminal-utils/formatter");

const Projects = require("../projects");
const Loader = require("../terminal-utils/async_loader");

/**
 * @Operation {
 *  @id "start",
 *  @label "Start project",
 *  @description "Start project environment.",
 *  @weight 100,
 *  @aliases "sta",
 *  @arguments {
 *    "key": {
 *      "description": "Root directory of the project to register.",
 *      "default": "Current working directory."
 *    }
 *  }
 * }
 */
class StartOperation {

  execute(args, workDir) {
    let projectLoad;
    const key = args.shift();

    if (key === null) {
      projectLoad = Projects.loadDir(workDir);
    }
    else {
      projectLoad = Projects.load(key);
    }

    return projectLoad.then((project) => {
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
      console.log(project.name.red + " project started!");
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
  }

  ensureProjectSetUp(project) {
    if (project.isSetUp()) {
      return Promise.resolve();
    }

    let setupLoader = new Loader("Setting up project");
    return project.setup().then(() => setupLoader.finish());
  }

}

module.exports = StartOperation;
