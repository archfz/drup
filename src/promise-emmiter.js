"use strict";

/**
 * Event emitter that support listeners promising.
 * It also supports data provisioning to listeners.
 * It also supports observer conscious registering.
 */
class PromiseEventEmitter extends require("events") {

  /**
   * Binds a listener with it's observer.
   *
   * Useful when observers must be known by the emitter.
   * So for example to shut out a listening object.
   *
   * @param {string} event
   *   The event name to listen to.
   * @param {function} callback
   *   The callback function.
   * @param {*} observer
   *   The observer.
   *
   * @return {PromiseEventEmitter}
   */
  onAssoc(event, callback, observer) {
    callback.observer = observer;
    this.on(event, callback);
    return this;
  }

  /**
   * Unbinds listeners of an observer for an event or all.
   *
   * @param {*} observer
   *   The observer.
   * @param {null|string} event
   *   The event from which to remove. Leave empty for all.
   *
   * @return {PromiseEventEmitter}
   */
  unbindObserver(observer, event = null) {
    if (event && this._events[event]) {
      this._unbindObserver(observer, event);
    }
    else {
      for (let event of Object.keys(this._events)) {
        this._unbindObserver(observer, event);
      }
    }

    return this;
  }

  /**
   * Helper method for unbinding observers.
   *
   * @param {string} observer
   * @param {string} event
   * @private
   */
  _unbindObserver(observer, event) {
    if (!(this._events[event] instanceof Array)) {
      this._events[event] = [this._events[event]];
    }

    let count = this._events[event].length;
    for (let i = 0; i < count; ++i) {
      if (this._events[event][i].observer && this._events[event][i].observer === observer) {
        this.removeListener(event, this._events[event][i]);
      }
    }
  }

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
