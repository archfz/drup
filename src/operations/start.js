"use strict";

const Environment = require("../environment/environment");
const cmd = require("../cmd");
const hostsManager = require("../hosts_manager");

module.exports = {
  description : "Start an environment.",
  run : () => {
    let environment;

    Environment.load("/home/zoltan.fodor/Documents/Drupal/test2")
      .then((env) => {
        environment = env;
        return env.getContainer("docker").start();
      })
      .then((docker) => {
        return docker.getIp("web");
      })
      .then((ip) => {
        return hostsManager.addHost(environment.config.projectName + ".dev", ip);
       })
      .catch(cmd.error);
  }
};