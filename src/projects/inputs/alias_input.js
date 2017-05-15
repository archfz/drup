"use strict";

const inquirer = require("inquirer");

const ProjectStorage = require("../storage");
const InputBase = require("../../form_input/input_base");

class AliasInput extends InputBase {

  /**
   * Create the default project key input.
   *
   * @returns {KeyInput}
   */
  static create() {
    return super.create(
      "input",
      "Project domain alias:",
      "Insert a domain alias base name. This should not contain an extension, as extensions will be the service ID name. So if you enter for example \"example\" one of your generated aliases might be \"example.nginx\".".green
    );
  }

  /**
   * @inheritDoc
   */
  acquire(_default = this._default) {
    // Generate suggestion alias.
    return this._generateUniqueAlias(_default)
      .then(super.acquire.bind(this))
  }

  /**
   * @inheritDoc
   */
  _acquire(_default) {
    return inquirer.prompt(this.getSettings(_default, "alias"))
      .then((values) => this._ensureUnique(values.alias))
      .catch((err) => {
        // This is the method used to restart the chain of promises without
        // causing duplicate task execution.
        if (err.alias) {
          return this._acquire(err.alias);
        }

        throw err;
      });
  }

  /**
   * Validates the project key.
   *
   * @param {string} alias
   * @returns {boolean|string}
   *    TRUE or error message.
   * @private
   */
  _validateInput(alias) {
    if (!alias) {
      return "Project alias is required.";
    }

    if (!alias.match(/^[a-z\-0-9]+$/)) {
      return "Should only contain a domain name, without extension.";
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
   * Generates unique alias for project.
   *
   * @param {string} suggestion
   *    String from which to generate.
   *
   * @return {string}
   *    Unique key.
   */
  _generateUniqueAlias(suggestion) {
    suggestion = suggestion.toLowerCase().replace(/[^a-z0-9\-]/g, '');

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
   * Ensures that given project alias is unique.
   *
   * @param {string} alias
   * @returns {Promise.<string>}
   *    Returns the key if unique. Otherwise throws.
   * @private
   */
  _ensureUnique(alias) {
    return this._isKeyUnique(alias)
      .then((unique) => {
        if (unique) {
          return alias;
        }

        console.warn("A project already has this alias. The domain alias must be unique.");
        throw {alias: alias};
      });
  }

  /**
   * Determines whether a project key is unique.
   *
   * @param {string} alias
   *    The project key.
   *
   * @returns {Promise.<boolean>}
   */
  _isKeyUnique(alias) {
    return ProjectStorage.getAll()
      .then((projects) => {
        for (const [key, project] of Object.entries(projects)) {
          if (project.config.host_alias === alias) {
            return false;
          }
        }

        return true;
      })
  }

}

module.exports = AliasInput;
