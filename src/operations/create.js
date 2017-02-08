"use strict";

const projectManager = require("../projects/manager");
const cmd = require("../cmd");

module.exports = {
  description : "Create new environment and install drupal in it.",
  run : () => {

    projectManager.setupFromGit("git@gitlab.pitechplus.com:Henkel/Silan.git")
      .then((data) => {
        console.log(data);
      })
      .catch(cmd.error);

  }
};