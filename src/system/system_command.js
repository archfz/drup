"use strict";

const exec = require('child_process').exec;

class SystemCommand {

  constructor(command, args = []) {
    if (typeof command !== "string") {
      throw "Command must be a string.";
    }

    if (!Array.isArray(args)) {
      throw "Parameters should be provided in array format.";
    }

    this.command = command;
    this.arguments = args;
  }

  resolve(output) {
    this.resolvePromise(output);
  }

  reject(error) {
    this.rejectPromise(error);
  }

  execute() {
    this.fullCommand = this.command + " ";
    this.arguments.forEach((argument) => {
      this.fullCommand += argument.join(" ");
    });

    let promise = new Promise((res, rej) => {
      this.resolvePromise = res;
      this.rejectPromise = rej;
    });

    exec(this.fullCommand, (error, stdout) => {
      if (error) {
        this.reject(error);
      } else {
        this.resolve(stdout);
      }
    });

    return promise;
  }

}

module.exports = SystemCommand;

