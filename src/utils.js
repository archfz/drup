"use strict";

const fs = require("fs");
const path = require("path");

/**
 * Helper functions.
 */
module.exports = {

  /**
   * Helper thrower for interface mimicking.
   *
   * @param {Object} object
   *    The object that must implement method.
   * @param {string} method
   *    The method name.
   */
  mustImplement(object, method) {
    throw new Error(`${object.constructor.name}' must implement ${method}().`);
  },

  /**
   * Collect module exports.
   *
   * @param {string} dir
   *    From directory.
   * @param {string} keyMethod
   *    Method of the module(s) used to key the modules.
   *
   * @returns {Object|Array}
   *    Array or Object keyed by module exports.
   */
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