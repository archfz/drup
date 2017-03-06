"use strict";

const Projects = require("../projects");

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
        console.log(`Start it by: drup start ${project.key}`);
      })
      .catch(console.error);

  }
};