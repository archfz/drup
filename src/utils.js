"use strict";

const fs = require("fs");
const path = require("path");

module.exports = {

  mustImplement(object, method) {
    throw new Error(`${object.constructor.name}' must implement ${method}().`);
  },

  collectModules(dir, keyMethod) {
    let modules;
    let files = fs.readdirSync(dir);

    if (keyMethod) {
      modules = {};
      files.forEach((filename) => {
        if (!filename.match(/\.js$/)) {
          return;
        }

        let module = require(dir + "/" + filename);
        modules[module[keyMethod]()] = module;
      });
    }
    else {
      modules = [];
      files.forEach((filename) => {
        if (!filename.match(/\.js$/)) {
          return;
        }

        modules.push(require(dir + "/" + filename));
      });
    }

    return modules;
  },

};