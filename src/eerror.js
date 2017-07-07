"use strict";

/**
 * A better error object.
 */
class ExtendedError extends Error {

  /**
   * Extended error constructor.
   *
   * @param {string} message
   *   The error message.
   * @param {string} name
   *   (Optional) An identifier for this type of error.
   */
  constructor(message, name = "") {
    super(message);
    this.name = name;
  }

  /**
   * Inherits error data from a previous error.
   *
   * To preserver stack and error message upon re-throws use this method.
   *
   * @param {Error|ExtendedError|string} error
   *   The previous error.
   *
   * @returns {ExtendedError}
   */
  inherit(error) {
    if (error instanceof ExtendedError || error instanceof Error) {
      this.parent = error;

      if (!this.code) {
        this.code = error.code;
      }
      if (!this.name) {
        this.name = error.name || error.code;
      }

    } else if (typeof error === "string") {
      this.message = error + "\n" + this.message;
    }

    return this;
  }

  /**
   * Gets the full stack trace.
   *
   * @returns {string}
   */
  getStackTrace() {
    let error = this;
    while (error.parent) {
      error = error.parent;
    }

    return error.stack;
  }

  getStackedErrors() {
    const errors = [];
    let error = this;

    while (error) {
      let stacks = error.stack.substr(error.message.length + "Error: ".length).trim();

      errors.push({
        messages: error.message.split("\n"),
        stacks: stacks ? stacks.split("\n") : [],
      });

      error = error.parent;
    }

    return errors.reverse();
  }

}

module.exports = ExtendedError;
