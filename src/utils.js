"use strict";

module.exports = {

  mustImplement(object, method) {
    throw `${object.constructor.name}' must implement ${method}().`;
  },

  collectModules(dir, keyMethod) {
    let modules;
    let files = require("fs").readdirSync(dir);

    if (keyMethod) {
      modules = {};
      files.forEach((filename) => {
        let module = require(dir + "/" + filename);
        modules[module[keyMethod]()] = module;
      });
    }
    else {
      modules = [];
      files.forEach((filename) => {
        modules.push(require(dir + "/" + filename));
      });
    }

    return modules;
  }

};