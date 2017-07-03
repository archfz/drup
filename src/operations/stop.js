"use strict";

const Projects = require("../projects");
const Loader = require("../terminal-utils/async_loader");

/*

 arguments: [
 {
 name: "key",
 description: "The key of the project.",
 default: "Current directory project.",
 optional: true,
 }
 ],

 */

/**
 * @Operation {
 *  @id "stop",
 *  @label "Stop project",
 *  @description "Stop project environment.",
 *  @aliases "sto",
 *  @weight 101,
 *  @arguments {
 *    "key": {
 *      "description": "Root directory of the project to register.",
 *      "default": "Current working directory."
 *    }
 *  }
 * }
 */
class StopOperation {

  execute(args, workDir) {
    let loader;
    const key = args.shift();

    let projectLoad = key ? Projects.load(key) : Projects.loadDir(workDir);

    return projectLoad.then((project) => {
      loader = new Loader("Stopping " + project.name + " ...");

      return project.stop().then(() => project);
    }).catch(console.error)
      .then((project) => {
        console.log(project.name + " stopped!");

        if (loader) {
          loader.destroy();
        }
      });
  }
}

module.exports = StopOperation;
