"use strict";

const os = require("os");
const fs = require("fs-promise");
const path = require("path");
const inquirer = require("inquirer");

const InputBase = require("./input_base");

/**
 * Provides directory path reading logic from user.
 */
class DirectoryInput extends InputBase {

  /**
   * Create the directory input.
   *
   * @param {string} name
   * @param {string} description
   *
   * @returns {DirectoryInput}
   */
  static create(name, description = "") {
    return super.create("input", name, description);
  }

  /**
   * Enable warning the user of possible path length limitations.
   *
   * @param {int} exceeds
   *    In case the length exceeds this amount.
   *
   * @returns {DirectoryInput}
   */
  warnPathLengthLimitations(exceeds = 200) {
    this._warnLength = exceeds;
    return this;
  }

  /**
   * Enabled warning about directories that are not empty.
   *
   * @returns {DirectoryInput}
   */
  warnNonEmpty() {
    this._warnNonEmpty = true;
    return this;
  }

  /**
   * Enable cleaning of directory if it exists.
   *
   * @returns {DirectoryInput}
   */
  cleanNonEmpty() {
    // Don't allow cleaning without warning first.
    this.warnNonEmpty();
    this._cleanNonEmpty = true;
    return this;
  }

  /**
   * Enabled requiring of existing directory path.
   *
   * @returns {DirectoryInput}
   */
  requireExisting() {
    this._requireExisting = true;
    return this;
  }

  /**
   * Enable requiring of absolute path.
   *
   * @returns {DirectoryInput}
   */
  requireAbsolute() {
    this._requireAbsolute = true;
    return this;
  }

  /**
   * @inheritDoc
   */
  _acquire(_default) {
    return inquirer.prompt(this.getSettings(_default, "directory"))
      .then((values) => this._doTransformRelative(values.directory))
      .then(this._doWarnLength.bind(this))
      .then(this._doRequireExisting.bind(this))
      .then(this._doWarnNonEmpty.bind(this))
      .then(this._doCleanNonEmpty.bind(this))
      .then(path.normalize)
      .catch((err) => {
        // This is the method used to restart the chain of promises without
        // causing duplicate task execution.
        if (err.dir) {
          return this._acquire(err.dir);
        }

        throw err;
      });
  }

  /**
   * Validate the directory.
   *
   * @param {string} directory
   *    The directory to validate.
   *
   * @returns {*}
   *    True if valid otherwise a message.
   * @private
   */
  _validateInput(directory) {
    if (this._requireAbsolute && !path.isAbsolute(directory)) {
      return "The path must be absolute.";
    }

    if (directory.match(/\\+/)) {
      return "Invalid directory path.";
    }

    return true;
  }

  /**
   * Promise to require existing directory if enabled.
   *
   * @param {string} directory
   *    The directory path.
   *
   * @returns {*}
   *    Directory or promise to get the directory.
   * @private
   */
  _doRequireExisting(directory) {
    if (!this._requireExisting) {
      return directory;
    }

    return fs.readdir(directory)
      .then(() => directory)
      .catch((err) => {
        if (err.code === "ENOENT") {
          console.warn("The provided directory does not exist!\n");
          throw {dir: directory};
        }

        throw err;
      });
  }

  /**
   * Promise to warn user about possible length limitations if enabled.
   *
   * @param {string} directory
   *    The directory path.
   *
   * @returns {*}
   *    Directory of promise of directory.
   * @private
   */
  _doWarnLength(directory) {
    if (!this._warnLength || os.platform() !== "win32") {
      return directory;
    }

    if (directory.length < this._warnLength) {
      return directory;
    }

    console.warn(`Directory path length too high!\nOn windows the max path length is 260, if you continue you might experience problems. It is suggested to use shorter path, in this case less than ${String(this._warnLength).yellow} characters. Answer 'no' to choose different directory.\n`);

    return inquirer.prompt({
      type: "confirm",
      name: "continue",
      message: "Take the risk?",
      default: false,
    }).then((v) => {
      if (v.continue) {
        return directory;
      }

      throw {dir: directory};
    });
  }

  /**
   * Promise to warn user about non empty directory enabled.
   *
   * @param {string} directory
   *    The directory path.
   *
   * @returns {*}
   *    Directory of promise of directory.
   * @private
   */
  _doWarnNonEmpty(directory) {
    if (!this._warnNonEmpty) {
      return directory;
    }

    return fs.readdir(directory)
      .then((files) => {
        if (!files.length) {
          return directory;
        }

        let lossPossibility = this._cleanNonEmpty ? "will" : "could";
        console.warn(`The provided directory is not empty!\n${directory.yellow}\nProceeding with this directory ${lossPossibility} result in ` + `file loss`.yellow + `. Are you sure you want to continue? Answer no to choose another directory.\n`);

        return inquirer.prompt({
          type: "confirm",
          name: "overwrite",
          message: this._cleanNonEmpty ? "Remove existing files and continue?" : "Overwrite existing files?",
          default: false,
        }).then((v) => {
          if (v.overwrite) {
            return directory;
          }

          throw {dir: directory};
        });
      })
      .catch((err) => {
        if (!err.dir || err.code === "ENOENT") {
          return directory
        }

        throw err;
      });
  }

  /**
   * Promise to clean the directory if exists and if enabled.
   *
   * @param {string} directory
   *    The directory path.
   *
   * @returns {*}
   *    Directory of promise of directory.
   * @private
   */
  _doCleanNonEmpty(directory) {
    if (!this._cleanNonEmpty) {
      return directory;
    }

    return fs.remove(directory).catch(() => directory);
  }

  /**
   * Transforms possible relative directory to absolute one.
   *
   * @param {string} directory
   *    The directory path.
   *
   * @returns {string}
   *    Absolute directory path.
   * @private
   */
  _doTransformRelative(directory) {
    if(["./", ".\\"].includes(directory.substr(0, 2))) {
      return path.normalize(process.cwd() + directory.substr(1));
    }
    else if (directory.substr(0, 2) === "~/") {
      return path.normalize(os.homedir() + directory.substr(1));
    }

    return directory;
  }

}

module.exports = DirectoryInput;
