"use strict";

const path = require("path");
const upath = require("upath");

const SystemCommand = require("../system/system_command");
const EError = require("../eerror");
const Environment = require("./environment");

/**
 * Provides detached docker command in means of standalone image.
 */
class BaseCommand extends SystemCommand {

  /**
   * @inheritDoc
   */
  constructor(command, args = []) {
    super(command, args);

    this.workingDirectory = "/";
    this.dockerArgs = [];
  }


  /**
   * Sets the working directory in container.
   *
   * @param {string} dir
   */
  setWorkingDirectory(dir) {
    if (typeof dir !== "string") {
      throw new EError(`Working directory paths must be string, provided: "${dir}"`);
    }

    // The working directory should always be in posix format as we are only
    // operating on linux in containers.
    dir = upath.normalize(dir);

    // Working directories should always be absolute.
    dir = dir[0] === "/" ? dir : "/" + dir;

    this.workingDirectory = dir;
    this._addWorkingDirectoryArgument(dir);
  }

  /**
   * Adds the current working directory to the command.
   *
   * @param {string} dir
   *   The directory.
   * @private
   */
  _addWorkingDirectoryArgument(dir) {
    let wIndex = this.dockerArgs.indexOf("-w");

    if (wIndex !== -1) {
      this.dockerArgs[wIndex + 1] = dir;
    }
    else {
      this.dockerArgs.push("-w", dir);
    }
  }

  /**
   * Sets relative working directory in container.
   *
   * @param {Environment} environment
   * @param {string} minWorkDir
   *    The minimum relative working directory inside path.
   * @param {string} hostWorkDir
   *    The directory of the host for which to calculate relative path.
   */
  setRelativeWorkingDirectory(environment, minWorkDir = "", hostWorkDir = process.cwd()) {
    let hostRoot = path.join(environment.root, Environment.DIRECTORIES.PROJECT, minWorkDir);
    let contRoot = path.join(this.workingDirectory, minWorkDir);

    // Determine if we are under the root of the project files on the host
    // system, and only if yes append the missing levels to the container
    // working directory.
    if (hostWorkDir.indexOf(hostRoot) === 0) {
      contRoot = path.join(contRoot, hostWorkDir.substr(hostRoot.length));
    }

    this.setWorkingDirectory(contRoot);
  }

  /**
   * @inheritDoc
   */
  inheritStdio() {
    // For docker commands we want a tty if the STD IO is inherited. This is
    // to allow for special chars and colors.
    this.dockerArgs.splice(1, 0, '-t');
    return super.inheritStdio();
  }

  /**
   * @inheritDoc
   */
  getArgumentArray() {
    if (!this._argArray) {
      let dockerArgs = this.dockerArgs;
      dockerArgs.push(this.dockerImage);

      // We need to escape all args so that they don't escape the custom quotes.
      let escapedArgs = super.getArgumentArray()
      // Remove possibly empty arguments so that we avoid hanging quotes.
        .filter((arg) => !!arg)
        .map((arg) => arg.replace(/(['"])/g, "\\$1"));

      this._argArray = dockerArgs;

      // To keep strings in commands we can put all of the args in between
      // quotes. This has to be done because by argv we will already have
      // quotes removed.
      if (escapedArgs.length) {
        let execArgs = "";

        escapedArgs.forEach((arg) => {
          // Add quotes only if we have space in the argument. Quoting
          // un-necessarily can break for certain arguments.
          if (arg.indexOf(" ") !== -1) {
            execArgs += "'" + arg + "' ";
          } else {
            execArgs += arg + " ";
          }
        });

        this._argArray.push(execArgs);
      }
    }

    return this._argArray;
  }

}

module.exports = BaseCommand;
