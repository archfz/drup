"use strict";

const cmd = require("./cmd");

module.exports = function(operations){
  return {
    alertUnrecognizedOperation(operation) {
      cmd.error("Unrecognized operation: " + operation);
      this.showAvailableOperations(operations);
    },

    showAvailableOperations() {
      cmd.heading("Available operations");

      operations.forEach((operation, opName) => {
        cmd.info(`${opName} : ${operation.description}`);
      });
    },

    showHelp() {
      this.showAvailableOperations();
    }
  };
};