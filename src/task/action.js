"use strict";

const utils = require("../utils");

module.exports = class Action {

  constructor(data) {
    this.data = data;
    this._promise = this.complete(data);

    if (!(this._promise instanceof Promise)) {
      throw new Error(`Action '${this.constructor.name}' didn't return a promise. Got '${this._promise}'`)
    }
  }

  complete(data) {
    utils.mustImplement(this, "complete");
  }

  revert() {

  }

};