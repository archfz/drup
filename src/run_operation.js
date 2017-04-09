"use strict";

const Projects = require("./projects");

let operations = [];
let helpOperation = () => {};

// Discover operations.
require("fs").readdirSync(__dirname+"/operations").forEach(function(file) {
  let operation = require("./operations/" + file);
  operation.baseName = file.split(".")[0];

  // Save the help operation for easier referencing.
  if (operation.baseName === "help") {
    helpOperation = operation;
  }

  operations.push(operation);
  operations.sort((a, b) => a.weight > b.weight);
});

/**
 * Search for operation alias/name in a list of operations.
 *
 * @param {string} operationName
 *    Alias or name of the operation.
 * @param {Array} inOperations
 *    List of operations.
 *
 * @returns {Object|null}
 *    The found operation or null.
 */
function findOperation(operationName, inOperations) {
  let found = null;

  inOperations.forEach((op) => {
    if (op.aliases.indexOf(operationName) !== -1) {
      found = op;
    }
  });

  return found;
}

/**
 * Main operation handler.
 *
 * @param operation
 *    The main operation.
 * @param args
 *    Arguments for the operation.
 *
 * @returns {*|Promise}
 */
module.exports = (operation, args) => {
  // Try to find the operation.
  let op = findOperation(operation, operations);

  if (op && op !== helpOperation) {
    // Check if help was requested for the operation.
    if ([...args].filter((a) => helpOperation.aliases.indexOf(a) !== -1).length) {
      return helpOperation.execute(op);
    }

    return op.execute(...args);
  }
  // If the operation was found and it is the help operation than we need to
  // send all other operations to display help.
  else if (op === helpOperation) {
    let specificOperations;
    // We might be in a project directory so it would be nice to show the
    // project specific operations as-well.
    Projects.loadDir(process.cwd())
      .then((project) => project.getEnvironment())
      .then((env) => specificOperations = env.getServiceOperations())
      .catch(() => {})
      .then(() => {
        helpOperation.execute(operations, specificOperations);
      })
      .catch(console.error);
  }
  // If no operation was found we assume project key.
  else if(operation) {
    let project;
    let projectOperations;

    // Try to load in the project by the key.
    Projects.load(operation)
      .catch(() => {
        // If no project was found by that key we might be running an operation
        // directly from project root. Add the operation to args.
        args.unshift(operation);
        return Projects.loadDir(process.cwd());
      })
      .then((proj) => (project = proj) && project.getEnvironment())
      // Run the operation if it was found.
      .then((env) => {
        projectOperations = env.getServiceOperations();

        if (!args) {
          return false;
        }

        let op = findOperation(args[0], projectOperations);

        if (op) {
          // Remove the operation name from the arguments.
          args.shift();
          env.runServiceOperation(op, args);
          return true;
        }

        return false;
      })
      // Check if the operation was found and if not display help.
      .then((found) => {
        if (!found) {
          if (args && args[0]) {
            console.log(`Project '${project.name}' doesn't have '${args[0]}' operation.\n`.red);
          }

          if (projectOperations.length) {
            helpOperation.specificOperationsHelp(projectOperations);
          }
          else {
            console.warn(`There are no operations for the '${project.name}' project.`);
          }
        }
      })
      // When all fails display help.
      .catch((err) => {
        console.log(`Undefined operation '${operation}'\n`.red);
        helpOperation.execute(operations);
      });
  }

};