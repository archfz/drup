"use strict";

const Projects = require("../projects");
const Loader = require("../terminal-utils/async_loader");

/**
 * @Operation {
 *  @id "configure",
 *  @label "Re-configure project.",
 *  @description "Re-configures a project and it's services.",
 *  @weight 35,
 *  @aliases "conf",
 *  @arguments {
 *    "key": {
 *      "description": "Type ID of the project to re-configure.",
 *      "default": "By default the current working directory project if exists."
 *    }
 *  }
 * }
 */
class ConfigureOperation {

  execute(args, workDir) {
    const key = args.shift();
    let projectLoad = key ? Projects.load(key) : Projects.loadDir(workDir);
    let project;
    let loader;

    return projectLoad.then((p) => (project = p) && p.getEnvironment())
      .then((env) => {
      console.warn("Reconfiguring a project can lead to data loss. All configuration and docker related files will be removed. If you have made any modification in the configuration files you should back them up. Also note that changing database will not keep your data, create backup.");

      env.on("reCompileStarted", () => loader = new Loader("Re-compiling " + project.name + " environment"));
      env.on("compileFinished", () => loader.finish("Re-compiled"));

      return project.reConfigure();
    })
      .then(() => console.log("\n\nOld containers have been removed. Restart your environment."))
      .catch(console.error);
  }

}

module.exports = ConfigureOperation;
