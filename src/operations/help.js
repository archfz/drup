"use strict";

const formatter = require("../terminal-utils/formatter");

const STR_DRUP = "drup ";
const STR_OPERATION = "<".gray + "operation".green + "> ".gray;
const STR_ENV_OPERATION = "<".gray + "env-operation".green + "> ".gray;
const STR_ARGS = "[<".gray + "arguments".yellow + ">] ".gray;
const STR_PROJECT = "<".gray + "project-key".red + "> ".gray;

module.exports = {
  aliases: [undefined, "help", "-h", "--help", "?", "-?", "/?"],
  weight: -1000,

  skipHelp: ["help"],

  execute: function (operations, specificOperations = null) {
    if (!Array.isArray(operations)) {
      return this.operationHelp(operations);
    }

    this.usageHelp();

    if (specificOperations) {
      this.specificOperationsHelp(specificOperations);
    }

    formatter.heading("Main operations");
    this.listOperations(operations.filter((op) => {
      return this.skipHelp.indexOf(op.baseName) === - 1;
    }));
  },

  usageHelp() {
    formatter.heading("Usage");
    console.log("$ " + STR_DRUP + STR_OPERATION + STR_ARGS);
    console.log("$ " + STR_DRUP + STR_PROJECT + STR_ENV_OPERATION + STR_ARGS);
  },

  listOperations(operations) {
    let opHelp = {};
    operations.forEach((op) => {
      opHelp[op.baseName] = op.description;
    });
    formatter.list(opHelp);
  },

  specificOperationsHelp: function (operations) {
    formatter.heading("Environment specific operations");
    this.listOperations(operations);
  },

  operationHelp: function (op) {
    formatter.heading("OPERATION: " + op.baseName);

    if (op.description) {
      console.log(op.description);
    }

    console.log("$ " + STR_DRUP + op.baseName.green + " " + STR_ARGS);

    if (op.arguments) {
      formatter.heading("Arguments");
      let args = {};

      op.arguments.forEach((arg) => {
        args[arg.name] = "";

        if (arg.description) {
          args[arg.name] = arg.description;
        }

        if (arg.optional) {
          args[arg.name] += "\n- optional";

          if (arg.default) {
            args[arg.name] += "; default: " + arg.default;
          }
        }
      });

      formatter.list({"arguments:": args}, null, "yellow");
    }

    console.log();
    formatter.list({"aliases:": op.aliases.join(", ")});

  }
};