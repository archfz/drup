"use strict";

const exec = require('child_process').exec;

module.exports = class SystemCommand {

  constructor(command, args = []) {
    if (typeof command !== "string") {
      throw new Error("Command must be a string.");
    }

    if (!Array.isArray(args)) {
      throw new Error("Parameters should be provided in array format.");
    }

    this.command = command;
    this.arguments = args;
  }

  toString() {
    if (!this.fullCommand) {
      this.fullCommand = this.command;
      this.arguments.forEach((argument) => {
        if (Array.isArray(argument)) {
          this.fullCommand += " " + argument.join(" ");
        }
        else {
          this.fullCommand += " " + argument;
        }
      });
    }

    return this.fullCommand;
  }

  resolve(output) {
    this.resolvePromise(output);
  }

  reject(error) {
    this.rejectPromise(error);
  }

  execute() {
    let promise = new Promise((res, rej) => {
      this.resolvePromise = res;
      this.rejectPromise = rej;
    });

    exec(this.toString(), (error, stdout) => {
      if (error) {
        this.reject(error);
      } else {
        this.resolve(stdout);
      }
    });

    return promise;
  }

};

