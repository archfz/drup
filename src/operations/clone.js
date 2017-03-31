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

  execute : (repository) => {

    Projects.clone(repository)
      .then((project) => {
        console.log("\n\"" + project.name.cyan + "\" project environment created.");
        console.log(`Start it by: ` + `drup start ${project.key}`.yellow);
        console.log("NOTE:".yellow + "You have to run this command with admin privileges.");
      })
      .catch(console.error);

  }
};