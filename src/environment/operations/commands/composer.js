"use strict";

const ComposerCommand = require("../../commands/composer");


class ComposerOperation extends ComposerCommand {

  /**
   * @inheritDoc
   */
  constructor(environment, args, hostWorkDir) {
    super(args);

    this.mountEnvironment(environment, ComposerCommand.COMPOSER_WORK_DIR);
    this.setRelativeWorkingDirectory(environment, "", hostWorkDir);
  }

}

module.exports = ComposerOperation;
