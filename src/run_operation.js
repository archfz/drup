"use strict";

const Projects = require("./projects");
const OperationCollection = require("./operation_collection");

const primaryOperations = new OperationCollection("Drup primary operations.", __dirname + "/operations");

/**
 * Main operation handler.
 *
 * @param {Array} args
 *    Arguments passed to the command line.
 *
 * @returns {*|Promise}
 */
module.exports = (args) => {
  let operation = args.shift();
  let projectOperations;

  // If the operation exists execute it.
  if (primaryOperations.has(operation)) {
    return primaryOperations.execute(operation, args);
  }

  // If no operations/key was given then show help.
  if (!operation || OperationCollection.HELP_REGEX.test(operation)) {
    primaryOperations.printList();
  }

};