"use strict";

const Projects = require("../projects");

module.exports = {
  description : "Register existing project from local drive.",
  aliases: ["register", "reg"],
  weight: 20,
  arguments: [
    {
      name: "directory",
      description: "Directory where the project resides.",
      default: "Current directory.",
      optional: true,
    }
  ],

  execute : (directory = process.cwd()) => {

    Projects.register(directory)
      .then((project) => {
        console.log("\n" + project.name + " is ready.");
      })
      .catch(console.error);

  }
};