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
        console.log("\n" + project.name + " is ready.");
        console.log(`Start it by: drup start ${project.key}`);
      })
      .catch(console.error);

  }
};