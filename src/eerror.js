"use strict";

class ExtendedError extends Error {

  constructor(message, name) {
    super(message);
    this.name = name;
  }

}

module.exports = ExtendedError;
