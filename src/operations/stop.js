"use strict";

const Environment = require("../environment/environment");
const Loader = require("../terminal-utils/async_loader");

module.exports = {
  description : "Stop an environment.",
  run : () => {
    let loader;
    Environment.load("/home/zoltan.fodor/Documents/Drupal/test2")
      .then((env) => {
        loader = new Loader("Stopping docker.");
        return env.getContainer("docker").stop();
      })
      .then((docker) => {
        loader.finish();
        console.log(docker.config.projectName + " stopped.");
      })
      .catch((err) => {
        console.log(err);
      });
  }
};