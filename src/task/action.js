"use strict";

const utils = require("../utils");

module.exports = class Action {

  complete(vars) {
    utils.mustImplement(this, "complete");
  }

  revert() {

  }

};