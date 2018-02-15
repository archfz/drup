"use strict";

const path = require("path");
const upath = require("upath");

const cmdOptions = require("../cmd_options");

const SystemCommand = require("../system/system_command");
const EError = require("../eerror");
const Environment = require("./environment");

/**
 * Provides detached docker command in means of standalone image.
 */
class BaseCommand extends SystemCommand {

  /**
   * Base command handler for docker commands.
   *
   * @param {string} dockerExecutor
   *   The base docker executable: docker or docker-compose.
   * @param {string} command
   *   Depending on the docker executable the primary command name.
   * @param {Array} args
   *   Arguments for the command.
   */
  constructor(dockerExecutor, command, args = []) {
    super(dockerExecutor, args);

    this.workingDirectory = "/";
    this.dockerCommand = command;
    this.dockerArgs = [];
    this.envVariables = {};
  }

  /**
   * Sets an environment variable.
   *
   * @param {string} key
   * @param {string} value
   */
  setEnvironmentVariable(key, value) {
    if (key.indexOf(" ") !== -1) {
      throw new Error(`Environment variable keys cannot contain spaces, found in "${key}"`);
    }

    this.envVariables[key] = value;
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
    if (!cmdOptions.hasOption('--no-tty')) {
      this.dockerArgs.splice(1, 0, '-t');
    }

    return super.inheritStdio();
  }

  /**
   * @inheritDoc
   */
  getArgumentArray() {
    if (!this._argArray) {
      let args = [];
      args.push(this.dockerCommand);

      for (let [key, value] of Object.entries(this.envVariables)) {
        args.push("-e", `${key}="${value.replace(/(['"])/g, "\\$1")}"`);
      }

      args = args.concat(this.dockerArgs);
      args.push(this.dockerImage);

      // We need to escape all args so that they don't escape the custom quotes.
      let escapedArgs = super.getArgumentArray()
      // Remove possibly empty arguments so that we avoid hanging quotes.
        .filter((arg) => !!arg)
        .map((arg) => arg.replace(/(['"])/g, "\\$1"));

      this._argArray = args;

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
