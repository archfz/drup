"use strict";

const Environment = require("../environment/environment");
const cmd = require("../cmd");
const hostsManager = require("../hosts_manager");
const globals = require("../projects/globals");

module.exports = {
  description : "Start an environment.",
  run : () => {
    let environment;
    let root = globals.PROJECTS_DIR + "/drupal/test/";

    Environment.load(root + "project/" + globals.ENV_CONFIG_FILENAME)
      .then((env) => {
        environment = env;
        return env.getContainer("docker", root).start();
      })
      .then((docker) => {
        return docker.getIp("web");
      })
      .then((ip) => {
        return hostsManager.addHost(environment.config.hostAlias, ip);
       })
      .catch(cmd.error);
  }
};