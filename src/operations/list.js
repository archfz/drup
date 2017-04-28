"use strict";

const formatter = require("../terminal-utils/formatter");

const ProjectStorage = require("../projects/storage");

/**
 * @Operation {
 *  @id "list",
 *  @label "List projects",
 *  @description "Lists all installed projects.",
 *  @weight 50,
 *  @aliases "ls",
 *  @arguments {
 *    "type": {
 *      "description": "List only the provided type of projects.",
 *      "default": "Defaults to all types of projects."
 *    }
 *  }
 * }
 */
class ListOperation {

  execute(args) {
    return ProjectStorage.getAll()
      .then((projects) => {
        let listByType = {};

        for (let [key, data] of Object.entries(projects)) {
          if (!listByType[data.type]) {
            listByType[data.type] = [];
          }

          listByType[data.type].push(key.green + " : " + data.config.name);
        }

        if (args[0]) {
          this.listProjects(listByType, args.shift());
        }
        else {
          this.listAllProjects(listByType);
        }
      });
  }

  listAllProjects(projectsByType) {
    console.log("-- List of all projects");
    for (let [type, list] of Object.entries(projectsByType)) {
      console.log("> " + type.toUpperCase().cyan + " projects");
      formatter.list(list);
      console.log();
    }
  }

  listProjects(projectsByType, type) {
    console.log("-- List of " + type.toUpperCase() + " projects");
    formatter.list(projectsByType[type]);
    console.log();
  }

}

module.exports = ListOperation;
