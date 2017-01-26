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

      for (let [opName, operation] of Object.entries(operations)) {
        cmd.info(`${opName} : ${operation.description}`);
      }
    },

    showHelp() {
      this.showAvailableOperations();
    }
  };
};