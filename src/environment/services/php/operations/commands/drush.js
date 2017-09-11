"use strict";

const AttachedCommand = require("../../../../attached_command");


class DrushOperation extends AttachedCommand {

  /**
   * @inheritDoc
   */
  constructor(environment, args, hostWorkDir) {
    super(environment, "php", "drush", args);

    let minWorkDir = environment.services.firstOfGroup("web").getDocumentRoot();
    this.setRelativeWorkingDirectory(minWorkDir, hostWorkDir);
  }

  /**
   * @inheritDoc
   */
  _addWorkingDirectoryArgument(dir) {
    // Overwrite parent functionality, because there are permission problems
    // when trying to run as a "sh -c" CD and drush.
    let wIndex = this.arguments.indexOf('-r');

    if (wIndex === -1) {
      this.arguments.push('-r', dir);
    } else {
      this.arguments[wIndex + 1] = dir;
    }
  }

}

module.exports = DrushOperation;
