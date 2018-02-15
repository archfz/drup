"use strict";

const os = require("os");
const fs = require("fs-promise");

const GLOBALS = require("../../globals");

const DetachedCommand = require("../detached_command");

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

    // By default we ignore platform requirements for installs and requires as
    // this is a separate container from the one in which the packages will be
    // used.
    if (args.includes("install") || args.includes("require")) {
      args.push("--ignore-platform-reqs");
    }

    super(ComposerCommand.COMPOSER_IMAGE, ComposerCommand.COMPOSER_WORK_DIR, args);

    // This volume should keep a host cache which speeds up further
    // runs of composer commands.
    this.mountVolume(ComposerCommand.COMPOSER_CACHE_DIR, "/composer");

    if (mountDirectory) {
      this.mountVolume(mountDirectory, ComposerCommand.COMPOSER_WORK_DIR);
    }
  }

  /**
   * @inheritDoc
   */
  execute(dir = null) {
    if (os.platform() === "linux") {
      // As we are mounting the composer directory to the host system
      // and this directory might not exists on the host, we have to
      // create it first on host so that proper permissions are added
      // to it. Otherwise caching would have permission denied.
      if (!fs.existsSync(ComposerCommand.COMPOSER_CACHE_DIR)){
        fs.mkdirSync(ComposerCommand.COMPOSER_CACHE_DIR);
      }
    }

    return super.execute(dir);
  }

}

ComposerCommand.COMPOSER_IMAGE = "composer/composer:alpine";
ComposerCommand.COMPOSER_CACHE_DIR = GLOBALS.GLOBAL_STORE_ROOT + ".composer/";
ComposerCommand.COMPOSER_WORK_DIR = "/app";

module.exports = ComposerCommand;
