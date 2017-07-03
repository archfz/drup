"use strict";

const Projects = require("./projects");
const OperationCollection = require("./operation_collection");

const primaryOperations = new OperationCollection("Drup primary operations.", __dirname + "/operations");

let operation;

let project;
let projectInCwd = false;
let projectOperations;

function showHelp() {
  if (project && !projectInCwd) {
    // If operation was not given but project was loaded by key
    // show help for the project specific operations.
    if (!operation) {
      projectOperations.printList();
    }
    // Otherwise the operation was not found for the project.
    else {
      // Print not found if the operation is not a help request.
      if (!OperationCollection.HELP_REGEX.exec(operation)) {
        console.log("NOT FOUND: ".red + "Project " + project.name.red + " does not have operation " + operation.green + "\n");
      }
      projectOperations.printList();
    }

    return;
  }

  // If the project was loaded from directory it means that
  // neither primary, nor project specific operation, nor
  // project key was found.
  if (operation && projectInCwd) {
    console.log("UN-KNOWN: ".yellow + operation.red + " is neither a primary operation or one for the project '" + project.name.green + "'\n");
    primaryOperations.printList();
    projectOperations.printList();
  }

  // If no operation/key was given then show all help.
  if (!operation || OperationCollection.HELP_REGEX.test(operation)) {
    primaryOperations.printList();
    projectOperations && projectOperations.printList();
  }
}

function runProjectOperations(projectLoad, args) {
  operation = args.shift();

  return projectLoad.then((project) => project.getOperations())
    // At this point we are assured that a project exists either
    // from current working directory or by first argument as key.
    .then((operations) => {
      operations.setHelpText("The project-key argument can be omitted when the current working directory is under the project.");

      projectOperations = operations;
      return projectOperations.execute(operation, args)
        // Exit code 0 if all went during the operation.
        .then(() => 0);
    })
    .catch((err) => {
      // Make sure we don't swallow important errors.
      if (
        err.name !== Projects.NOT_FOUND_ERR &&
        err.name !== OperationCollection.OP_NOT_FOUND_ERR
      ) {
        throw err;
      }

      throw OperationCollection.OP_NOT_FOUND_ERR;
    });
}

/**
 * Main operation handler.
 *
 * @param {Array} args
 *    Arguments passed to the command line.
 *
 * @returns {Promise}
 */
module.exports = (args = []) => {
  // If the operation exists execute it.
  if (primaryOperations.has(args[0])) {
    operation = args.shift();
    return primaryOperations.execute(operation, args)
    // Exit code 0.
      .then(() => 0);
  }

  // At this point no primary operations was found for the key.
  // The next thing is to see if we are under the directory of
  // an existing project. In that case try to run the projects
  // environment specific operations.
  // Priority goes to calling project operation with project
  // key, as otherwise from one project directory you couldn't
  // call other projects operations.
  return runProjectOperations(Projects.load(args[0]), args.slice(1))
    .catch((err) => {
      // Send real errors till the end of chain.
      if (err.name !== OperationCollection.OP_NOT_FOUND_ERR) {
        throw err;
      }
      // At this point either the project could not be loaded
      // or it was loaded but did not have operation.
      return runProjectOperations(Projects.loadDir(process.cwd()), args);
    })
    .catch((err) => {
      if (
        err.name !== OperationCollection.OP_NOT_FOUND_ERR &&
        err.name !== OperationCollection.NO_OP_ERR
      ) {
        throw err;
      }

      // At this point there was no primary operation and no
      // project could be loaded neither way.
      showHelp();
      // If no project could be loaded it means that something
      // was wrong.
      return 1;
    })
    .catch(console.error);

};