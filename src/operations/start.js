"use strict";

const Environment = require("../environment/environment");
const cmd = require("../cmd");

module.exports = {
  description : "Start an environment.",
  run : () => {
    Environment.load("/home/zoltan.fodor/Documents/Drupal/test2")
      .then((env) => {
        return env.getContainer("docker").start();
      })
      .then((docker) => {
        return docker.getIp();
      })
      .then((ip) => {
      console.log(ip);
     }).catch(cmd.error);
  }
};