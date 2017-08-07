"use strict";

const spawn = require('child_process').spawn;

/**
 * Class SystemCommand.
 *
 * Adds wrapper over child process spawn to make calling system commands
 * easier. Also it provides the handling in promise.
 */
class SystemCommand {

  /**
   * System command constructor.
   *
   * @param {string} command
   *    The command string.
   * @param {Array[]} args
   *    The arguments for the command.
   */
  constructor(command, args = []) {
    if (typeof command !== "string") {
      throw new Error("Command must be a string.");
    }

    if (command.indexOf(" ") !== -1) {
      throw new Error(`Command should not contain spaces: '${command}'`);
    }

    if (!Array.isArray(args)) {
      throw new Error("Parameters should be provided in array format.");
    }

    this._dataCallbacks = [];
    this._inherit = false;
    this.command = command;
    this.arguments = args;
  }

  /**
   * Enables interactive command.
   */
  inheritStdio() {
    this._inherit = true;
    return this;
  }

  /**
   * Gets the string representation of the full command.
   *
   * @returns {string}
   */
  toString() {
    if (!this.fullCommand) {
      this.fullCommand = this.command + " " + this.getArgumentArray().join(" ");
    }

    return this.fullCommand;
  }

  /**
   * Converts the multi dimensional arguments to one dimensional.
   *
   * @returns {Array}
   *    The plain array of arguments.
   */
  getArgumentArray() {
    if (!this._argArray) {
      this._argArray = [];
      this.arguments.forEach((argument) => {
        if (Array.isArray(argument)) {
          this._argArray = this._argArray.concat(argument);
        }
        else {
          this._argArray.push(argument);
        }
      });
    }

    return this._argArray;
  }

  /**
   * Resolves the promise when the command finished.
   *
   * @param {string} data
   * @private
   */
  _resolve(data) {
    this._resolvePromise(data);
  }

  /**
   * Rejects the promise on error.
   *
   * @param {Error} err
   * @private
   */
  _reject(err) {
    this._rejectPromise(err);
  }

  /**
   * Terminates the process.
   */
  kill() {
    if (!this._process) {
      return;
    }

    this._process.kill("SIGINT");
  }

  /**
   * Registers listener for data read.
   *
   * @param {Function} callback
   *    The callback function that will receive the data as parameter.
   */
  onData(callback) {
    this._dataCallbacks.push(callback);
  }

  /**
   * Callback to process data of command.
   *
   * @param d
   *    The data.
   * @private
   */
  _processStdout(d) {
    d = d.toString();
    this.data += d;
    this._dataCallbacks.forEach((callback) => callback(d));
  }

  /**
   * Callback to process error data of command.
   *
   * @param d
   *    The data.
   * @private
   */
  _processStderr(d) {
    d = d.toString();
    this.errorData += d;
  }

  /**
   * Executes the command.
   *
   * @param {string|null} inDir
   *    In what directory to execute. Default current.
   *
   * @returns {Promise}
   *    Promise that will resolve with data or reject with error.
   */
  execute(inDir = null) {
    this.data = "";
    this.errorData = "";

    let options = {
      cwd: inDir,
      env: process.env,
      shell: true,
    };

    let promise = new Promise((res, rej) => {
      this._resolvePromise = res;
      this._rejectPromise = rej;
    });

    if (this._inherit) {
      options.stdio = "inherit";
    }

    this._process = spawn(this.command, this.getArgumentArray(), options);

    if (!this._inherit) {
      this._process.stdout.on("data", this._processStdout.bind(this));
      this._process.stderr.on("data", this._processStderr.bind(this));
    }

    this._process.on("error", (err) => this._reject(err));
    this._process.on("exit", (code) => {
      if (code !== 0) {
        const error = new Error(`${this.errorData}\nCommand: ${this.toString()}\nExit code: ${code}`);
        // In certain situation it is needed to exit the with the executed
        // commands exit code, so save the spawn exit code it in the error.
        error.code = code;
        this._reject(error);
      }
      
      this._resolve(this.data + this.errorData);
    });

    return promise;
  }

}

module.exports = SystemCommand;
