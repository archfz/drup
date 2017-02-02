"use strict";

const Environment = require('../environment/environment');
const Loader = require("../terminal-utils/async_loader");
const cmd = require("../cmd");

module.exports = {
  description : "Create new environment and install drupal in it.",
  run : () => {
    let loader;

    Environment.create({projectName: "test2"}, ['engine', 'web', 'database']).then((env) => {
      loader = new Loader("saving environment config");
      return env.saveConfigTo("/home/zoltan.fodor/Documents/Drupal/test2");
    }).then((env) => {
      console.log("Environment config created.");
      loader.setMessage("generating docker env");
      return env.composeContainer("docker");
    }).then((docker) => {
      console.log("Docker environment generated.");
      loader.finish("over");
    }).catch((err) => {
      console.error("Chain failed:\n" + err);
    });
  }
};