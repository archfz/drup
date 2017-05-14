"use strict";

const utils = require("../utils");

/**
 * Form input base class.
 */
class InputBase {

  /**
   * Form input base constructor.
   *
   * @param {string} type
   *    The type of the input.
   * @param {string} name
   *    The input name displayed to user.
   * @param {string} description
   *    Optional description about the input.
   */
  constructor(type, name, description = "") {
    if (!type || typeof type !== "string") {
      throw new Error(`Input type is required and needs to be string. Provided '${name}'`);
    }

    if (!name || typeof name !== "string") {
      throw new Error(`Input name is required and needs to be string. Provided '${name}'`);
    }

    this._type = type;
    this._name = name;
    this._description = description;
  }

  /**
   * Convenience instantiation method.
   * @see constructor
   */
  static create(type, name, description) {
    return new this.prototype.constructor(type, name, description);
  }

  /**
   * Builds the settings object for the inquirer prompt.
   *
   * @param {string} _default
   *    Default value for the input.
   * @param {string} name
   *    Property name the will contain the input value.
   *
   * @returns {Object}
   *    Settings object.
   */
  getSettings(_default, name = "value") {
    let settings = {
      type: this._type,
      name: name,
      message: this._name,
      default: _default || this._default,
    };

    if (typeof this._validateInput === "function") {
      settings.validate = this._validateInput.bind(this);
    }

    if (typeof this._filterValue === "function") {
      settings.filter = this._filterValue.bind(this);
    }

    return settings;
  }

  /**
   * Set the provided value as default.
   *
   * @param {*} value
   *
   * @return {InputBase}
   */
  setDefault(value) {
    this._default = value;
    return this;
  }

  /**
   * Initiate the input.
   *
   * @param {*} _default
   *    Default value for the input.
   *
   * @returns {Task<string>}
   *    The acquired directory from user.
   */
  acquire(_default = this._default) {
    if (this._description) {
      console.log(this._description);
    }

    return this._acquire(_default);
  }

  /**
   * Acquire the value.
   *
   * @param _default
   * @private
   */
  _acquire(_default) {
    utils.mustImplement(this, "_acquire");
  }

}

module.exports = InputBase;