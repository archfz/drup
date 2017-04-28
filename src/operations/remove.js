"use strict";

const inquirer = require("inquirer");

const Projects = require("../projects");
const Loader = require("../terminal-utils/async_loader");

/**
 * @Operation {
 *  @id "remove",
 *  @label "Remove project",
 *  @description "Remove project and it's environment.",
 *  @aliases "rm",
 *  @weight 30,
 *  @arguments {
 *    "key": {
 *      "description": "The project key.",
 *      "default": "Current working directory projects key, if exists."
 *    }
 *  }
 * }
 */
class RemoveOperation {

  execute(args, workDir) {
    let projectLoad;
    let loader;
    const key = args.shift();

    if (key === null) {
      projectLoad = Projects.loadDir(workDir);
    }
    else {
      projectLoad = Projects.load(key);
    }

    return projectLoad.then((project) => {
      console.log("You requested to remove: " + project.name.green);
      console.log("This will " + "remove all".red + " your configurations and files.");
      console.log();

      return inquirer.prompt({
        type: "confirm",
        name: "remove",
        message: "Are you sure you want to remove?",
        default: false,
      }).then((data) => {
        if (!data.remove) {
          return;
        }

        loader = new Loader("Removing " + project.name + " ...");
        return project.remove().then((project) => {
          console.log(project.name + " removed.");
        });
      })
    })
    .catch(console.error)
    .then(() => loader && loader.destroy());
  }

}

module.exports = RemoveOperation;
