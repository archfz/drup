"use strict";

const GLOBALS = require("../../globals");

const SystemCommand = require("../system_command");

const COMPOSER_IMAGE = "composer/composer:alpine";
const COMPOSER_CACHE_DIR = GLOBALS.GLOBAL_STORE_ROOT + ".composer/";

/**
 * Runner for composer command.
 */
class ComposerCommand extends SystemCommand {

  /**
   * Composer command constructor.
   *
   * @param {Array} args
   *    The arguments to pass to composer.
   * @param {string} directory
   *    The directory where to run composer.
   */
  constructor(args, directory = "{dir}") {
    // Make sure we are getting the best speed;
    args.unshift("--prefer-dist");

    // Run composer through docker to remove host dependency
    // requirements. This also fixes many problems with windows.
    args = [
      "run", "--rm",
      // This volume should keep a host cache which also speeds
      // up further runs of composer commands.
      ["-v", COMPOSER_CACHE_DIR + ":/composer/"],
      // Most importantly the directory where composer should
      // be run must be in the container.
      ["-v", directory + ":/app"],
      COMPOSER_IMAGE
    ].concat(args);

    super("docker", args);

    if (directory !== "{dir}") {
      this._volumeSet = true;
    }
  }

  /**
   * @inheritdoc
   */
  execute(dir = null) {
    if (typeof dir !== "string" && !this._volumeSet) {
      throw new Error(`Composer command executed without volume:\n'${this.toString()}'`);
    }

    // Allow overriding or setting the directory where to run
    // composer from execute.
    if (dir !== null) {
      this.arguments.forEach((arg, i) => {
        if (typeof arg === "string" && arg.indexOf(":/app")) {
          this.arguments[i] = arg.replace(/[^:]+/, dir);
        }
      });
    }

    return super.execute();
  }

}

module.exports = ComposerCommand;
