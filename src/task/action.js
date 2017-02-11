"use strict";

const utils = require("../utils");

/**
 * Class Action.
 *
 * Provides base class for actions. These get run by a Task and should be used
 * only by a Task.
 */
class Action {

  /**
   * Action constructor.
   *
   * Instantiating an action will immediately start it.
   *
   * @param data
   *    The task data.
   */
  constructor(data) {
    this.data = data;
    this._promise = this.complete(data);

    if (!(this._promise instanceof Promise)) {
      throw new Error(`Action '${this.constructor.name}' didn't return a promise. Got '${this._promise}'`)
    }
  }

  /**
   * Completes the action.
   *
   * Must be implemented by every child.
   *
   * @param data
   *    The task data.
   */
  complete(data) {
    utils.mustImplement(this, "complete");
  }

  /**
   * Optionally reverts the things that the action completed.
   */
  revert() {

  }

};

module.exports = Action;
