"use strict";

/**
 * Event emitter that support listeners promising.
 * It also supports data provisioning to listeners.
 */
class PromiseEventEmitter extends require("events") {

  /**
   * Override of the default emmit to allow data passing.
   *
   * @param {string} event
   *   The event name.
   * @param {...} data
   *   The data to pass to the listeners.
   *
   * @return {object}
   */
  emit(event, ...data) {
    if (!this._events[event]) {
      return this;
    }

    let listeners = this._events[event];
    if (!(listeners instanceof Array)) {
      listeners = [listeners];
    }

    listeners.forEach((listener) => listener(...data));
    return this;
  }

  /**
   * Notifies the listeners and allows them to promise.
   *
   * @param {string} event
   *   The event name.
   * @param {...} data
   *   Data to send to listeners.
   *
   * @return {Promise}
   */
  emitPromise(event, ...data) {
    if (!this._events[event]) {
      return Promise.resolve();
    }

    let listeners = this._events[event];
    if (!(listeners instanceof Array)) {
      listeners = [listeners];
    }

    let promises = [];
    listeners.forEach((listener) => {
      const response = listener(...data);

      if (response instanceof Promise) {
        promises.push(response);
      }
    });

    return Promise.all(promises);
  }

}

module.exports = PromiseEventEmitter;
