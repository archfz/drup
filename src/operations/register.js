"use strict";

const Projects = require("../projects");
const cmd = require("../cmd");

module.exports = {
  description : "Register existing project from local drive.",
  run : (directory = process.cwd()) => {

    Projects.register(directory)
      .then((project) => {
        console.log("\n" + project.name + " is ready.");
      })
      .catch(cmd.error);

  }
};