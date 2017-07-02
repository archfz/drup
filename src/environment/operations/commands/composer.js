"use strict";

const ComposerCommand = require("../../commands/composer");


class ComposerOperation extends ComposerCommand {

  constructor(environment, args, hostWorkDir) {
    super(args);

    this.mountEnvironment(environment);
    this.setRelativeWorkingDirectory(environment, "", hostWorkDir);
  }

}

module.exports = ComposerOperation;
