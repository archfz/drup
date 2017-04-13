"use strict";

const path = require("path");
const fs = require("fs-promise");

const annotation = require("./annotations");

/**
 * Module that provides loading classes from modules with
 * annotation data appended, and helpers to get them.
 */
module.exports = {

  /**
   * Load in single module class annotated.
   *
   * @param {string} modulePath
   *    Full path to the module JS file.
   *
   * @returns {Object}
   *    The annotated class.
   */
  loadClass: function (modulePath) {
    // Try to load in the module that will contain the exported
    // class with annotations.
    const module = require(modulePath);
    if (!module) {
      throw new Error(`Failed to load in module: ${modulePath}\n`);
    }

    // Require function objects. We are expecting a class.
    if (typeof module !== "function") {
      throw new Error(`Class object expected. Got '${typeof module}' for ${modulePath}`);
    }

    // Get and add the annotation for the class. Make it accessible
    // by the class and it's instance as-well.
    module.annotations = annotation.getSync(modulePath)[module.name];
    module.ann = function (key) {
      return this.annotations[key];
    };
    module.prototype.ann = module.ann.bind(module);

    return module;
  },

  /**
   * Get collection of classes annotated.
   *
   * @param {string[]} filePaths
   *    The full paths to the JS modules.
   * @param {string} keyAnnotation
   *    Optional annotation key to use for keying.
   *
   * @returns {Array|Object}
   *    Array of classes or object keyed by keyAnnotation of
   *    each module if provided.
   */
  collectFromFiles: function (filePaths, keyAnnotation = null) {
    // First get all the classes that the modules provide.
    let classes = filePaths.map((filePath) => {
      return this.loadClass(filePath);
    });

    // If there is no keying defined then return as plain array.
    if (!keyAnnotation) {
      return classes;
    }

    // If we have keying then convert the array to an object.
    let keyedClasses = {};
    classes.forEach((Class) => {
      let moduleClass = Class.name;

      if (!Class.ann(keyAnnotation)) {
        throw new Error(`The ${moduleClass} must have '${keyAnnotation}' annotation.`);
      }

      let key = Class.ann(keyAnnotation);
      if (keyedClasses[key]) {
        throw new Error(`The ${moduleClass} and ${keyedClasses[key].name} have the same key: ${key}`);
      }

      keyedClasses[key] = Class;
    });

    return keyedClasses;
  },

  /**
   * Get collection of classes.
   *
   * @param {string} dir
   *    Directory from which to collect.
   * @param {string} keyAnnotation
   *    @see this.collectFromFiles()
   *
   * @returns {Array|Object}
   */
  collectClasses: function (dir, keyAnnotation = null) {
    // Collect JS files from the directory.
    let files = fs.readdirSync(dir).filter((filename) => {
      return Boolean(filename.match(/\.js$/));
    });

    return this.collectFromFiles(files.map((file) => dir + "/" + file), keyAnnotation);
  },

  /**
   * Get collection of classes found in directories.
   *
   * This is collection from directories that contain index.js.
   *
   * @param {string} dir
   *    Directory where the module directories are.
   * @param {string} keyAnnotation
   *    @see this.collectFromFiles()
   *
   * @returns {Array|Object}
   */
  collectDirectoryClasses(dir, keyAnnotation = null) {
    // Collect directory names from the directory.
    let directories = fs.readdirSync(dir).filter((filename) => {
      return !Boolean(filename.match(/\.js$/));
    });

    return this.collectFromFiles(directories.map((dirName) => dir + "/" + dirName + "/index.js"), keyAnnotation);
  }

};
