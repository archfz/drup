"use strict";

const annotatedLoader = require("../ann_loader");

const OperationBase = require("operation_base");

// Directory where operation handlers reside.
const OPERATIONS_DIR = __dirname + "/operations/";

let allLoaded = false;
let operations = {};

/**
 * Provides loading of operations.
 */
module.exports = {

  /**
   * Gets a specific environment operation.
   *
   * @param {string} id
   *    ID of the operation.
   *
   * @returns {OperationBase}
   */
  getOperation: function (id) {
    if (!operations[id]) {
      operations[id] = annotatedLoader.loadClass(OPERATIONS_DIR + id);
    }

    return operations[id];
  },

  /**
   * Gets all available environment operations.
   *
   * @returns {Object.<OperationBase>}
   */
  getOperations: function () {
    if (allLoaded) {
      return operations;
    }

    operations = annotatedLoader.collectClasses(OPERATIONS_DIR);
    return operations;
  }

};
