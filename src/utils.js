"use strict";

const fs = require("fs");
const annotation = require("./annotations");
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

  collectAnnotated(dir, keyAnnotation = null, searchDir = false) {
    let modules;
    let files = fs.readdirSync(dir);

    const addAnnotations = (toModule, filename) => {
      if (searchDir) {
        filename += "/index.js";
      }

      let annotationData = annotation.getSync(path.join(dir, filename))[toModule.name];

      toModule.annotations = annotationData;
      toModule.ann = function (key) {
        return this.annotations[key];
      };
      toModule.prototype.ann = function (key) {
        return this.constructor.ann(key);
      };

      return toModule;
    };

    if (keyAnnotation) {
      modules = {};

      files.forEach((filename) => {
        if (Boolean(filename.match(/\.js$/)) === searchDir) {
          return;
        }

        let module = require(dir + "/" + filename);
        addAnnotations(module, filename);
        let moduleClass = module.name;

        if (!module.ann(keyAnnotation)) {
          throw new Error(`The ${moduleClass} must have '${keyAnnotation}' annotation.`);
        }

        let key = module.ann(keyAnnotation);
        if (modules[key]) {
          throw new Error(`The ${moduleClass} and ${modules[key].name} have the same key: ${key}`);
        }

        modules[key] = module;
      });
    }
    else {
      modules = [];

      files.forEach((filename) => {
        if (Boolean(filename.match(/\.js$/)) === searchDir) {
          return;
        }

        modules.push(addAnnotations(require(dir + "/" + filename), filename));
      });
    }

    return modules;
  }

};