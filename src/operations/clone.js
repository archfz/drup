"use strict";

const Projects = require("../projects");

/**
 * @Operation {
 *  @id "clone",
 *  @label "Clone project",
 *  @description "Clone existing project from repository.",
 *  @weight 10,
 *  @aliases "cl",
 *  @arguments {
 *    "repository": {
 *      "description": "The repository address from where to clone.",
 *      "optional": true
 *    }
 *  },
 * }
 */
class CloneOperation {

  execute(args) {
    return Projects.clone(args.shift())
      .then((project) => {
        console.log("\n\"" + project.name.cyan + "\" project environment created.");
        console.log(`Start it by: ` + `drup start ${project.key}`.yellow);
        console.log("NOTE:".yellow + "You have to run this command with admin privileges.");
      })
      .catch(console.error);
  }

}

module.exports = CloneOperation;
