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
      "Project domain aliases:",
      "Insert a domain alias base name. This should not contain an extension, as extensions will be the service ID name. So if you enter for example \"example\" one of your generated aliases might be \"example.nginx\".\nFor multiple aliases separate each one with a comma.".green
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
    return inquirer.prompt(this.getSettings(_default, "aliases"))
      .then((values) => this._transformInput(values.aliases))
      .then(this._ensureUnique.bind(this))
      .catch((err) => {
        // This is the method used to restart the chain of promises without
        // causing duplicate task execution.
        if (err.aliases) {
          return this._acquire(err.aliases.join(", "));
        }

        throw err;
      });
  }

  /**
   * Transforms aliases string to an array.
   *
   * @param {string} aliases
   *   The aliases.
   *
   * @return {Array.<string>}
   *   Aliases in array format.
   * @private
   */
  _transformInput(aliases) {
    aliases = aliases.split(",");

    for (let i = 0; i < aliases.length; ++i) {
      aliases[i] = aliases[i].trim();
    }

    return aliases;
  }

  /**
   * Validates the project key.
   *
   * @param {Array.string} aliases
   * @returns {boolean|string}
   *    TRUE or error message.
   * @private
   */
  _validateInput(aliases) {
    if (!aliases) {
      return "You must input at least one alias.";
    }

    for (let i = 0; i < aliases.length; ++i) {
      if (!aliases[i].match(/^[a-z\-0-9, ]+$/)) {
        return "Should only contain a domain name, without extensions (no dots): " + aliases[i];
      }
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
   * @return {Promise.<string>}
   *    Unique key.
   */
  _generateUniqueAlias(suggestion) {
    let promises = [];

    const generateKey = (alias, count = "") => {
      return this._isKeyUnique(alias + count)
        .then((unique) => {
          if (unique) {
            return alias + count;
          }

          return generateKey(alias, count === "" ? 2 : count + 1);
        });
    };

    this._transformInput(suggestion).forEach((alias) => {
      alias = alias.toLowerCase().replace(/[^a-z0-9\-]/g, '');
      promises.push(generateKey(alias));
    });

    return Promise.all(promises).then((aliases) => aliases.join(", "));
  }

  /**
   * Ensures that given project alias is unique.
   *
   * @param {Array.<string>} aliases
   * @returns {Promise.<Array>}
   *    Returns the aliases if unique. Otherwise throws.
   * @private
   */
  _ensureUnique(aliases) {
    let promises = [];

    aliases.forEach((alias) => {
      let promise = this._isKeyUnique(alias)
        .then((unique) => {
          if (unique) {
            return;
          }

          console.warn(`A project already has the "${alias}" alias. The domain alias must be unique.`);
          throw {aliases: aliases};
        });

      promises.push(promise);
    });

    return Promise.all(promises).then(() => aliases);
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
          let aliases = project.config.host_aliases;

          // @DEPRECATED support for single host alias.
          if (project.config.host_alias) {
            aliases = [project.config.host_alias];
          }

          if (aliases.indexOf(alias) !== -1) {
            return false;
          }
        }

        return true;
      })
  }

}

module.exports = AliasInput;
