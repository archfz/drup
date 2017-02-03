"use strict";

const Environment = require('../environment/environment');
const EnvConfigurator = require('../environment/environment_configurator');
const Loader = require("../terminal-utils/async_loader");
const cmd = require("../cmd");

module.exports = {
  description : "Create new environment and install drupal in it.",
  run : () => {
    let loader;
    const configurator = new EnvConfigurator({
      group: {
        required: ["web", "database"],
        single: ["web", "database"]
      },
      service: {
        required: ["php"],
        restricted: ["mongodb"]
      }
    });

    Environment.create(configurator, {projectName: "test2"}).then((env) => {
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
      cmd.error(err);
    });
  }
};