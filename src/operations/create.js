"use strict";

const Projects = require("../projects");

module.exports = {
  description : "Create new project.",
  aliases: ["create", "cr"],
  weight: 1,
  arguments: [
    {
      name: "type",
      description: "Type of project to create.",
      optional: true,
    }
  ],

  execute : (type = null) => {

    Projects.create(type)
      .then((project) => {
        console.log("\n\"" + project.name.cyan + "\" project environment created.");
        console.log(`Start it by: ` + `drup start ${project.key}`.yellow);
        console.log("NOTE:".yellow + "You have to run this command with admin privileges.");
      })
      .catch(console.error);

  }
};