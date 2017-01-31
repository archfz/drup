"use strict";

const Environment = require('../environment/environment');
const Loader = require("../terminal-utils/async_loader");

module.exports = {
  description : "Create new environment and install drupal in it.",
  run : () => {
    let loader;

    Environment.create(['php', 'web', 'database']).then((env) => {
      loader = new Loader("saving environment config");
      return env.save("/home/zoltan.fodor/Documents/Drupal/test");
    }).then((env) => {
      loader.setMessage("generating docker env");
      return env.write("docker", "/home/zoltan.fodor/Documents/Drupal/test");
    }).then((docker) => {
      loader.setMessage("starting docker");
      return docker.start();
    }).then(() => {
      loader.finish("container started");
    }).catch((err) => {
      console.log(err);
      console.error("Chain failed:\n" + err);
    });
  }
};