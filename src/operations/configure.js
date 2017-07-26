"use strict";

const Projects = require("../projects");

/**
 * @Operation {
 *  @id "create",
 *  @label "Create project.",
 *  @description "Create new project of selected type.",
 *  @weight 1,
 *  @aliases "cr",
 *  @arguments {
 *    "type": {
 *      "description": "Type ID of the project to create.",
 *      "default": "By default you'll be asked to select the type."
 *    }
 *  }
 * }
 */
class CreateOperation {

  execute(args) {
    return Projects.create(args.shift())
      .then((project) => {
        console.log("\n\"" + project.name.cyan + "\" project environment created.");
        console.log(`Start it by: ` + `drup start ${project.key}`.yellow);
        console.log("NOTE:".yellow + "You have to run this command with admin privileges.");
      })
      .catch(console.error);
  }

}

module.exports = CreateOperation;
