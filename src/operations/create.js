"use strict";

const DockerContainer = require('../docker/container');

module.exports = {
  description : "Create new environment and install drupal in it.",
  run : () => {
    let container = new DockerContainer();
    container.configure().then(() => {
      container.save("/mnt/d/");
    });
  }
};