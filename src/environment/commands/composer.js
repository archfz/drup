"use strict";

const GLOBALS = require("../../globals");

const DetachedCommand = require("../detached_command");

const COMPOSER_IMAGE = "composer/composer:alpine";
const COMPOSER_CACHE_DIR = GLOBALS.GLOBAL_STORE_ROOT + ".composer/";
const COMPOSER_WORK_DIR = "/app";

/**
 * Runner for composer command.
 */
class ComposerCommand extends DetachedCommand {

  /**
   * Composer command constructor.
   *
   * @param {Array} args
   *    The arguments to pass to composer.
   * @param {string} mountDirectory
   *    The directory where to run composer.
   */
  constructor(args, mountDirectory) {
    // Make sure we are getting the best speed;
    args.unshift("--prefer-dist");
    super(COMPOSER_IMAGE, COMPOSER_WORK_DIR, args);

    // This volume should keep a host cache which speeds up further
    // runs of composer commands.
    this.mountVolume(COMPOSER_CACHE_DIR, "/composer");

    if (mountDirectory) {
      this.mountVolume(mountDirectory, COMPOSER_WORK_DIR);
    }
  }

}

module.exports = ComposerCommand;
