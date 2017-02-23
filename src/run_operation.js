"use strict";

const cmd = require("./cmd");

const Projects = require("./projects");

let operations = [];
let helpOperation = () => {};

require("fs").readdirSync(__dirname+"/operations").forEach(function(file) {
  let operation = require("./operations/" + file);
  operation.baseName = file.split(".")[0];

  if (operation.baseName === "help") {
    helpOperation = operation;
  }

  operations.push(operation);
  operations.sort((a, b) => a.weight > b.weight);
});

function findOperation(operationName, inOperations) {
  let found;

  inOperations.forEach((op) => {
    if (op.aliases.indexOf(operationName) !== -1) {
      found = op;
    }
  });

  return found;
}

module.exports = (operation, args) => {
  let op = findOperation(operation, operations);

  if (op && op !== helpOperation) {
    if ([...args].filter((a) => helpOperation.aliases.indexOf(a) !== -1).length) {
      return helpOperation.execute(op);
    }

    return op.execute(...args);
  }
  else if (op === helpOperation) {
    let specificOperations;
    Projects.loadDir(process.cwd())
      .then((project) => project.getEnvironment())
      .then((env) => specificOperations = env.getServiceOperations())
      .catch(() => {})
      .then(() => {
        helpOperation.execute(operations, specificOperations);
      })
      .catch(cmd.error);
  }
  else if(operation) {
    let project;
    let projectOperations;

    Projects.load(operation)
      .catch(() => {
        args.unshift(operation);
        return Projects.loadDir(process.cwd());
      })
      .then((proj) => (project = proj) && project.getEnvironment())
      .then((env) => {
        projectOperations = env.getServiceOperations();

        if (!args) {
          return false;
        }

        let op = findOperation(args[0], projectOperations);

        if (op) {
          env.runServiceOperation(op, ...args);
          return true;
        }

        return false;
      })
      .then((found) => {
        if (!found) {
          if (args) {
            console.log(`Project '${proj.name}' doesn't have '${args[0]}' operation.\n`.red);
          }

          helpOperation.specificOperationsHelp(projectOperations);
        }
      })
      .catch(() => {
        console.log(`Undefined operation '${operation}'\n`.red);
        helpOperation.execute(operations);
      })
  }

};