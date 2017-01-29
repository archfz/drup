"use strict";

const DockerContainer = require("../docker/container");

module.exports = {
  description : "Start an environment.",
  run : () => {
    new DockerContainer("/mnt/d/").start();
  }
};