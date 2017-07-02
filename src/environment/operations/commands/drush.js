"use strict";

const DetachedCommand = require("../../detached_command");


class DrushOperation extends DetachedCommand {

  constructor(environment, args, hostWorkDir) {
    super("drush/drush", "", args);

    let minWorkDir = environment.services.firstOfGroup("web").getDocumentRoot();

    this.connectNetwork(environment);
    this.mountEnvironment(environment);
    this.setRelativeWorkingDirectory(environment, minWorkDir, hostWorkDir);
  }

}

module.exports = DrushOperation;
