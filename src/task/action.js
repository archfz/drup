"use strict";

class Action {

  constructor() {
    this._completed = false;
  }

  complete(callback) {
    if (this._completed) {
      return false;
    }

    this._fire('_doWork', (succeeded) => {
      if (succeeded && typeof this._onCompleted === "function") {
        this._onCompleted();
      } else if (typeof this._onFailed === "function") {
        this._onFailed();
      }

      callback(succeeded);
    });
    return true;
  }

  revert(callback) {
    if (this._completed) {
      return false;
    }

    this._fire('_doRevert', callback, false);
    return true;
  }

  _fire(method, callback, completedModifier = true) {
    if (typeof this[method] !== "function") {
      throw new Error(`Action: an action must implement the ${method} method.`);
    }

    let completion = this[method]();

    if (typeof completion === "boolean") {
      this._completed = (completion === completedModifier);
      callback(completion);
    } else if (completion instanceof Promise) {
      completion.then(
        () => {
          this._completed = completedModifier;
          callback(true);
        },
        () => {
          this._completed = !completedModifier;
          callback(false);
        }
      ).catch(error => {
        console.error(error);
      });
    } else {
      throw new Error(`Action: ${method} method must return boolean or a Promise.`);
    }
  }

}

module.exports = Action;