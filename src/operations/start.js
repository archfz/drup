"use strict";

const DockerContainer = require("../environment/environment");

module.exports = {
  description : "Start an environment.",
  run : () => {
    new DockerContainer("/mnt/d/").start();
  }
};