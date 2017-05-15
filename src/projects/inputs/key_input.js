"use strict";

const inquirer = require("inquirer");

const ProjectStorage = require("../storage");
const InputBase = require("../../form_input/input_base");

class KeyInput extends InputBase {

  /**
   * Create the default project key input.
   *
   * @returns {KeyInput}
   */
  static create() {
    return super.create(
      "input",
      "Project unique key:",
      "Insert a unique ID for the project. This will be used to easily run operation on the project environment. For best usage add a short one.".green
    );
  }

  /**
   * @inheritDoc
   */
  acquire(_default = this._default) {
    // Generate suggestion key.
    return this._generateUniqueKey(_default)
      .then(super.acquire.bind(this))
  }

  /**
   * @inheritDoc
   */
  _acquire(_default) {
    return inquirer.prompt(this.getSettings(_default, "key"))
      .then((values) => this._ensureUnique(values.key))
      .catch((err) => {
        // This is the method used to restart the chain of promises without
        // causing duplicate task execution.
        if (err.key) {
          return this._acquire(err.key);
        }

        throw err;
      });
  }

  /**
   * Validates the project key.
   *
   * @param {string} key
   * @returns {boolean|string}
   *    TRUE or error message.
   * @private
   */
  _validateInput(key) {
    if (!key) {
      return "Project key is required.";
    }

    if (!key.match(/^[a-z][a-z0-9]+$/)) {
      return "Key may only container letters and numbers, and may only start with letter.";
    }

    return true;
  }

  /**
   * Filters the value.
   *
   * @param {string} key
   * @returns {string}
   * @private
   */
  _filterValue(key) {
    return key.toLowerCase();
  }

  /**
   * Generates unique key for project.
   *
   * @param {string} suggestion
   *    String from which to generate.
   *
   * @return {string}
   *    Unique key.
   */
  _generateUniqueKey(suggestion) {
    suggestion = suggestion.toLowerCase();
    let words = suggestion.split(/[ ]+/);
    if (words.length > 2) {
      suggestion = words.map((word) => word.charAt(0)).join("");
    }

    suggestion = suggestion.replace(/[^a-z0-9]/g, "");

    const generateKey = (count = "") => {
      return this._isKeyUnique(suggestion + count)
        .then((unique) => {
          if (unique) {
            return suggestion + count;
          }

          return generateKey(count === "" ? 2 : count + 1);
        });
    };

    return generateKey();
  }

  /**
   * Ensures that given project key is unique.
   *
   * @param {string} key
   * @returns {Promise.<string>}
   *    Returns the key if unique. Otherwise throws.
   * @private
   */
  _ensureUnique(key) {
    return this._isKeyUnique(key)
      .then((unique) => {
        if (unique) {
          return key;
        }

        console.warn("A project already has this key. The key must be unique.");
        throw {key: key};
      });
  }

  /**
   * Determines whether a project key is unique.
   *
   * @param {string} key
   *    The project key.
   *
   * @returns {Promise.<boolean>}
   */
  _isKeyUnique(key) {
    return ProjectStorage.get(key)
      .then((config) => config === null);
  }

}

module.exports = KeyInput;
