"use strict";

const Module = require("module");
const path = require("path");
const fs = require("fs-promise");

const annotation = require("./annotation");

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
   * @param {string} annotationKey
   *    The annotation key/name that contains the annotation data.
   *
   * @returns {Object}
   *    The annotated class.
   */
  loadClass: function (modulePath, annotationKey) {
    modulePath = path.normalize(modulePath);

    // Try to load in the module content that will contain the exported
    // class with annotations.
    let moduleContent;
    let moduleExport;

    try {
      moduleContent = fs.readFileSync(modulePath).toString();

      // To prevent loading the contents of the file we can directly
      // created the module from the files content. This already
      // doubles the performance.
      let m = new Module(modulePath, module.parent);
      m.filename = modulePath;
      m.paths = Module._nodeModulePaths(path.dirname(modulePath));
      m._compile(moduleContent, modulePath);

      moduleExport = m.exports;
    } catch (err) {
      if (err instanceof Error) {
        err.message = `Failed to load in module: ${modulePath}\n${err}`;
        throw err;
      }
      else {
        throw new Error(`Failed to load in module: ${modulePath}\n${err}`);
      }
    }

    // Require function objects. We are expecting a class.
    if (typeof moduleExport !== "function") {
      throw new Error(`Class object expected. Got '${typeof moduleExport}' for ${modulePath}`);
    }

    // Get and add the annotation for the class. Make it accessible
    // by the class and it's instance as-well.
    try {
      moduleExport.annotations = annotation.readFromString(moduleContent, annotationKey);
    } catch (err) {
      throw new Error(`Failed adding class annotations for: ${modulePath}\n${err}`);
    }

    moduleExport.ann = function (key) {
      return this.annotations[key];
    };
    moduleExport.prototype.ann = moduleExport.ann.bind(moduleExport);

    return moduleExport;
  },

  /**
   * Get collection of classes annotated.
   *
   * @param {string[]} filePaths
   *    The full paths to the JS modules.
   * @param {string} annotationKey
   *    The annotation key/name that contains the annotation data.
   * @param {string} keyBy
   *    Optional annotation key to use for keying.
   *
   * @returns {Array|Object}
   *    Array of classes or object keyed by keyAnnotation of
   *    each module if provided.
   */
  collectFromFiles: function (filePaths, annotationKey, keyBy = null) {
    // First get all the classes that the modules provide.
    let classes = filePaths.map((filePath) => {
      return this.loadClass(filePath, annotationKey);
    });

    // If there is no keying defined then return as plain array.
    if (!keyBy) {
      return classes;
    }

    // If we have keying then convert the array to an object.
    let keyedClasses = {};
    classes.forEach((Class) => {
      let moduleClass = Class.name;

      if (!Class.ann(keyBy)) {
        throw new Error(`The '${moduleClass}' class must have '${keyBy}' annotation.`);
      }

      let key = Class.ann(keyBy);
      if (keyedClasses[key]) {
        throw new Error(`The '${moduleClass}' class and '${keyedClasses[key].name}' class have the same key: ${key}`);
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
   * @param {string} annotationKey
   *    The annotation key/name that contains the annotation data.
   * @param {string} keyBy
   *    @see this.collectFromFiles()
   *
   * @returns {Array|Object}
   */
  collectClasses: function (dir, annotationKey, keyBy = null) {
    // Collect JS files from the directory.
    let files = fs.readdirSync(dir).filter((filename) => {
      return Boolean(filename.match(/\.js$/));
    });

    return this.collectFromFiles(files.map((file) => dir + "/" + file), annotationKey, keyBy);
  },

  /**
   * Get collection of classes found in directories.
   *
   * This is collection from directories that contain index.js.
   *
   * @param {string} dir
   *    Directory where the module directories are.
   * @param {string} annotationKey
   *    The annotation key/name that contains the annotation data.
   * @param {string} keyBy
   *    @see this.collectFromFiles()
   *
   * @returns {Array|Object}
   */
  collectDirectoryClasses(dir, annotationKey, keyBy = null) {
    // Collect directory names from the directory.
    let directories = fs.readdirSync(dir).filter((filename) => {
      return !Boolean(filename.match(/\.js$/));
    });

    return this.collectFromFiles(directories.map((dirName) => dir + "/" + dirName + "/index.js"), annotationKey, keyBy);
  }

};
