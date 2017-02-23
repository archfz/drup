"use strict";

const Projects = require("../projects");
const cmd = require("../cmd");

module.exports = {
  description : "Clone existing project from repository.",
  aliases: ["clone", "cl"],
  weight: 10,
  arguments: [
    {
      name: "repository",
      description: "The repository to pull from.",
      optional: true,
    }
  ],

  execute : (repository ) => {

    Projects.clone(repository)
      .then((project) => {
        console.log("\n" + project.name + " is ready.");
      })
      .catch(cmd.error);

  }
};