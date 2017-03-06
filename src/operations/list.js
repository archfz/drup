"use strict";

const formatter = require("../terminal-utils/formatter");

const ProjectStorage = require("../projects/storage");

module.exports = {
  description : "List all environments and their state.",
  aliases: ["list", "ls"],
  weight: 50,
  arguments: [
    {
      name: "type",
      description: "Types of projects to list.",
      optional: true,
    }
  ],

  execute : () => {

    ProjectStorage.getAll()
      .then((projects) => {
        let listByType = {};

        for (let [key, data] of Object.entries(projects)) {
          if (!listByType[data.type]) {
            listByType[data.type] = [];
          }

          listByType[data.type].push(key.green + " : " + data.config.name);
        }

        console.log("-- List of installed projects");
        for (let [type, list] of Object.entries(listByType)) {
          console.log("> " + type.toUpperCase().cyan + " projects");
          formatter.list(list);
          console.log();
        }

      });

  }
};