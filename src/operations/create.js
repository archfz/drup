"use strict";

const projectManager = require("../projects/manager");
const cmd = require("../cmd");

module.exports = {
  description : "Create new environment and install drupal in it.",
  run : () => {

    projectManager.setupNew()
      .then((data) => {
        console.log(data.get("config.name") + " project is ready.");
      })
      .catch(cmd.error);

  }
};