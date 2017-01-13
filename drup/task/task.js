"use strict";

const Action = require('./action');

class Task {

  constructor() {
    this._actionQueue = [];
    this._completedActions = [];

    this._events = {
      complete: [],
      fail: [],
    };

    this._completed = true;
  }

  complete(action) {
    if (!(action instanceof Action)) {
      throw "Task: only objects of type Action can be _completed.";
    }

    this._actionQueue.push(action);

    if (this._completed === true) {
      this._advance();
    }

    this._completed = false;
    return this;
  }

  abort() {
    this._revertAll();
  }

  on(event, fn) {
    if (!this._events[event]) {
      throw `Task: type of '${event}' is not recognized.`;
    }

    this._events[event].push(fn);
    return this;
  }

  _advance() {
    if (!this._actionQueue.length) {
      this._completed = true;
      this._notify('complete');
      return;
    }

    let action = this._actionQueue.shift();
    this._completedActions.push(action);

    action.complete((succeeded) => {
      if (succeeded) {
        this._advance();
      } else {
        this._revertAll();
        this._notify('fail');
      }
    });
  }

  _revertAll() {
    this._completedActions.forEach((action) => {
      action.revert((revertSucceeded) => {
        if (!revertSucceeded) {
          console.warn(`Task: reverting action '${action.constructor.name}' failed.`);
        }
      });
    });
  }

  _notify(eventName) {
    this._events[eventName].forEach(fn => fn());
  }

}

module.exports = Task;