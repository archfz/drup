"use strict";

const Projects = require("../projects");
const cmd = require("../cmd");

module.exports = {
  description : "Clone existing project from repository.",
  run : (repository ) => {

    Projects.clone(repository)
      .then((project) => {
        console.log("\n" + project.name + " is ready.");
      })
      .catch(cmd.error);

  }
};