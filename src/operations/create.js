"use strict";

const Projects = require("../projects");
const cmd = require("../cmd");

module.exports = {
  description : "Create new project.",
  run : (type = null) => {

    Projects.create(type)
      .then((project) => {
        console.log("\n" + project.name + " is ready.");
      })
      .catch(cmd.error);

  }
};