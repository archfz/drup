"use strict";

const AttachedCommand = require("../../attached_command");

class ShellOperation extends AttachedCommand {

  /**
   * @inheritDoc
   */
  constructor(environment, serviceId) {
    super(environment, serviceId, "sh", []);
  }

}

module.exports = ShellOperation;
