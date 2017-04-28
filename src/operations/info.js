"use strict";

const Projects = require("../projects");

/**
 * @Operation {
 *  @id "info",
 *  @label "Information",
 *  @description "Print information about project and it's environment.",
 *  @weight 120,
 *  @aliases "i",
 *  @arguments {
 *    "key": {
 *      "description": "The project key.",
 *      "default": "Current working directory projects key, if exists."
 *    }
 *  }
 * }
 */
class InfoOperation {

  execute(args, workDir) {
    let projectLoad;
    const key = args.shift();

    if (key === null) {
      projectLoad = Projects.loadDir(workDir);
    }
    else {
      projectLoad = Projects.load(key);
    }

    return projectLoad.then((project) => project.printInformation())
      .catch(console.error);
  }

}

module.exports = InfoOperation;
