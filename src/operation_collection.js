"use strict";

const formatter = require("./terminal-utils/formatter");
const annotationLoader = require("./ann_loader");

const EError = require("./eerror");

const STR_DRUP = "$".gray + " drup";

const STR_ARGUMENT_START = "<".gray;
const STR_ARGUMENT_END = ">".gray;
const STR_OPTIONAL_START = "[".gray;
const STR_OPTIONAL_END = "]".gray;


/**
 * Loop over the arguments of an operation.
 *
 * @param {Object} operation
 * @param {Function} callbackFunc
 */
function eachArgument(operation, callbackFunc) {
  const opArgs = operation.ann("arguments") || {};
  Object.entries(opArgs).forEach(([name, argument]) => callbackFunc(argument, name));
}

/**
 * Creates operation arguments formatted/colored string.
 *
 * @param {Object} operation
 * @returns {string}
 */
function formatOperationArguments(operation) {
  let args = [];
  eachArgument(operation, (arg, name) => {
    if (arg.optional || arg.default) {
      return args.push(OperationCollection.formatOptionalStr(name));
    }

    return args.push(OperationCollection.formatArgumentStr(name));
  });

  return args.join(" ");
}

/**
 * Collects operations and provides useful actions over them.
 */
class OperationCollection {

  /**
   * OperationCollection constructor.
   *
   * @param {string} collectionTitle
   *    A title/label for this collection of operation.
   * @param {string} collectFrom
   *    The directory in which the operations are found.
   * @param {boolean} fromDirectories
   *    Whether collect index.js file from directories in collectFrom.
   */
  constructor(collectionTitle, collectFrom, fromDirectories = false) {
    this._operations = {};
    this._aliases = {};
    this._predefinedArgs = [];

    this._usage_format = "{OP_ID}";

    this.collectionTitle = collectionTitle;

    this.addFrom(collectFrom, fromDirectories);
  }

  /**
   * Add additional operations to initial ones.
   *
   * @param {string} directory
   *    The directory of the operation classes.
   * @param {boolean} fromDir
   *    Collect from files or directories.
   *
   * @returns {OperationCollection}
   */
  addFrom(directory, fromDir = false) {
    let operations;

    if (fromDir) {
      operations = annotationLoader.collectDirectoryClasses(directory, "Operation", "id");
    }
    else {
      operations = annotationLoader.collectClasses(directory, "Operation", "id");
    }

    for (const [id, operation] of Object.entries(operations)) {
      if (this._operations[id]) {
        throw new Error(`Duplicate operation ID '${id}' from '${operation.ann("label")}' and '${this._operations[id].ann("label")}'.`);
      }

      // Aliases value is allowed to be string. But for usability sake
      // we want it to be an array.
      let aliases = operation.ann("aliases");
      operation.annotations.aliases = typeof aliases === "string" ? [aliases] : aliases;
      // The ID of the operation is the primary alias.
      operation.annotations.aliases.push(operation.ann("id"));

      // Verify that we don't have duplicate aliases.
      operation.ann("aliases").forEach((alias) => {
        if (this._aliases[alias]) {
          throw new Error(`Duplicate alias '${alias}' found from '${operation.ann("label")}' and '${this._operations[this._aliases[alias]].ann("label")}'.`);
        }

        this._aliases[alias] = id;
      });

      // Ensure all operations have weight so that they can be sorted.
      operation.annotations.weight = operation.ann("weight") || 1;

      this._operations[id] = operation;
    }

    return this;
  }

  /**
   * Loop over the operations.
   *
   * @param {Function} callbackFunc
   *    It will receive the operation and operation ID arguments.
   *
   * @returns {OperationCollection}
   */
  each(callbackFunc) {
    Object.keys(this._operations)
      .sort((a, b) => this._operations[a].ann("weight") > this._operations[b].ann("weight"))
      .forEach((key) => callbackFunc(this._operations[key], key));
    return this;
  }

  /**
   * Filters out operations depending on provided filter function.
   *
   * @param {Function.<boolean>} filterFunc
   *    Function that should whether to keep or discard the op.
   *
   * @returns {OperationCollection}
   */
  filter(filterFunc) {
    for (const [id, operation] of Object.entries(this._operations)) {
      if (filterFunc(operation)) {
        continue;
      }

      operation.ann("aliases").forEach((alias) => {
        delete this._aliases[alias];
      });

      delete this._operations[id];
    }

    return this;
  }

  /**
   * Set custom usage format template.
   *
   * @param {string} format
   *
   * @returns {OperationCollection}
   */
  setUsageFormat(format) {
    this._usage_format = format;
    return this;
  }

  /**
   * Pushes predefined argument for operation execution.
   *
   * These will be added to all operations.
   *
   * @param {*} argument
   *
   * @returns {OperationCollection}
   */
  addPredefinedArgument(argument) {
    this._predefinedArgs.push(argument);
    return this;
  }

  /**
   * Sets help text that shows on usage help print.
   *
   * @param text {string}
   *   The help text.
   */
  setHelpText(text) {
    this._helpText = text;
    return this;
  }

  /**
   * Prints to the terminal the usage of the operation.
   *
   * @param {String|Object} operation
   *    (Optional) If the operation is not defined the general
   *    usage of this collection is printed.
   *
   * @returns {OperationCollection}
   */
  printUsage(operation = null) {
    if (typeof operation === "string") {
      operation = this.get(operation, true);
    }

    let usage = this._usage_format;

    if (operation) {
      usage = usage.replace("{OP_ID}", operation.ann("id").green)
        + " " + formatOperationArguments(operation);
    }
    else {
      usage = usage.replace("{OP_ID}", OperationCollection.formatArgumentStr("operation", "green"))
       + " " + OperationCollection.formatArgumentStr("arguments..");
    }

    console.log(STR_DRUP + " " + usage);

    if (this._helpText) {
      console.log(this._helpText);
    }

    return this;
  }

  /**
   * Print information about the arguments of operation.
   *
   * @param {String|Object} operation
   *
   * @returns {OperationCollection}
   */
  printArguments(operation) {
    if (typeof operation === "string") {
      operation = this.get(operation, true);
    }

    let args = {};
    eachArgument(operation, (arg, name) => {
      let key = name.yellow;
      if (arg.optional || arg.default) key += " (optional)".grey;
      args[key] = arg.description + (arg.default ? "\nDefault: ".grey + arg.default : "");
    });

    formatter.list(args);
    return this;
  }

  /**
   * Prints a list of the operations with description and args.
   *
   * @returns {OperationCollection}
   */
  printList() {
    formatter.heading(this.collectionTitle);
    this.printUsage();
    console.log();

    let opHelp = {};
    this.each((operation, id) => {
      opHelp[id + " " + formatOperationArguments(operation)] = operation.ann("description");
    });

    formatter.list(opHelp);
    return this;
  }

  /**
   * Prints help for an operation.
   *
   * @param {String|Object} operation
   *
   * @returns {OperationCollection}
   */
  printHelp(operation) {
    if (typeof operation === "string") {
      operation = this.get(operation, true);
    }

    formatter.heading("OPERATION: " + operation.ann("label"));

    if (operation.ann("description")) {
      console.log(operation.ann("description"));
      this.printUsage(operation);
      console.log();
      this.printArguments(operation);
    }

    return this;
  }

  /**
   * Determines whether operation exists.
   *
   * @param {string} operation
   *    ID or alias of operation.
   *
   * @returns {boolean}
   */
  has(operation) {
    return !!this._aliases[operation];
  }

  /**
   * Gets operation.
   *
   * @param {string} operation
   *    ID or alias of operation.
   * @param {boolean} ensure
   *    Whether to throw if doesn't exist.
   *
   * @returns {Object}
   */
  get(operation, ensure = false) {
    if (ensure && !this._aliases[operation]) {
      throw new EError(`Operation '${operation}' not found`, this.constructor.OP_NOT_FOUND_ERR);
    }

    return this._operations[this._aliases[operation]];
  }

  /**
   * Execute operation.
   *
   * @param {string} operation
   *    ID or alias of the operation.
   * @param {Array.<string>} args
   *    The arguments to send to execute.
   *
   * @returns {Promise}
   */
  execute(operation, args = []) {
    if (!operation) {
      throw new EError("No operation specified.", OperationCollection.NO_OP_ERR);
    }

    operation = new (this.get(operation, true))();

    if (!operation.ann("prevent_help") && OperationCollection.HELP_REGEX.test(args[0])) {
      this.printHelp(operation);
      return Promise.resolve();
    }

    return operation.execute(...this._predefinedArgs, args, process.cwd());
  }

}

/**
 * Create colored format of an argument.
 *
 * @param {string} argumentName
 * @param {string} color
 * @returns {string}
 */
OperationCollection.formatOptionalStr = (argumentName, color = "yellow") => {
  return STR_OPTIONAL_START + argumentName[color] + STR_OPTIONAL_END;
};

/**
 * Create colored format of an optional argument.
 *
 * @param {string} argumentName
 * @param {string} color
 * @returns {string}
 */
OperationCollection.formatArgumentStr = (argumentName, color = "yellow") => {
  return STR_ARGUMENT_START + argumentName[color] + STR_ARGUMENT_END;
};

OperationCollection.OP_NOT_FOUND_ERR = "OP_NOT_FOUND_ERR";
OperationCollection.NO_OP_ERR = "NO_OP_ERR";

OperationCollection.HELP_REGEX = /^\?|--help|-h$/;

module.exports = OperationCollection;
