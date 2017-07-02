"use strict";

const Projects = require("../projects");

/**
 * @Operation {
 *  @id "register",
 *  @label "Register project",
 *  @description "Register existing project from local drive.",
 *  @weight 20,
 *  @aliases "reg",
 *  @arguments {
 *    "key": {
 *      "description": "Root directory of the project to register.",
 *      "default": "Current working directory."
 *    }
 *  }
 * }
 */
class RegisterOperation {

  execute(args, workDir) {
    let directory = args.shift() || workDir;

    return Projects.register(directory)
      .then((project) => {
        console.log("\n" + project.name.red + " is ready.");
      })
      .catch(console.error);
  }

}

module.exports = RegisterOperation;
