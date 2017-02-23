"use strict";

const cmd = require("../cmd");

module.exports = {
  aliases: [undefined, "help", "-h", "--help", "?", "-?", "/?"],
  weight: -1000,

  skipHelp: ["help"],

  execute: function (operations, specificOperations = null) {
    if (!Array.isArray(operations)) {
      return this.operationHelp(operations);
    }

    cmd.info("Usage: \ndrup <operation> [<arguments>]\ndrup <project-key> <operation> [<arguments>]");

    if (specificOperations) {
      this.specificOperationsHelp(specificOperations);
    }

    cmd.heading("Available operations");

    operations.forEach((op) => {
      if (this.skipHelp.indexOf(op.baseName) !== - 1) {
        return;
      }

      cmd.info(`${op.baseName} : ${op.description}`);
    });
  },

  specificOperationsHelp: function (operations) {
    cmd.heading("Environment specific operations");

    operations.forEach((op) => {
      if (this.skipHelp.indexOf(op.baseName) !== - 1) {
        return;
      }

      cmd.info(`${op.baseName} : ${op.description}`);
    });
  },

  operationHelp: function (op) {
    let args = "";

    if (op.arguments) {
      args = "-arguments:";

      op.arguments.forEach((arg) => {
        args += "\n   ";

        if (arg.optional) {
          args += "[" + arg.name + "]";

          if (arg.default) {
            args += " (default: " + arg.default + ")";
          }
        }
        else {
          args += arg.name;
        }

        if (arg.description) {
          args += " : " + arg.description;
        }
      });
    }

    let aliases = "\n-aliases: " + op.aliases.join(", ");
    cmd.info(`${op.baseName} : ${op.description}\n${args}${aliases}`);
  }
};