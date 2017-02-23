"use strict";

const Projects = require("../projects");
const cmd = require("../cmd");

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
      })
      .catch(cmd.error);

  }
};