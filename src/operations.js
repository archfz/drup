"use strict";

let operations = {};
require("fs").readdirSync(__dirname+"/operations").forEach(function(file) {
  operations[file.split('.')[0]] = require("./operations/" + file);
});

let guide = require("./guide")(operations);

module.exports = (operation, args) => {

  if(!operation || operation === "help") {
    guide.showHelp();
    return 1;
  }

  if (!operations[operation]) {
    guide.alertUnrecognizedOperation(operation);
    return 0;
  }

  operations[operation].run(...args);

};