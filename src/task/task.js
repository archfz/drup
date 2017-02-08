"use strict";

const ActionBase = require('./action');

module.exports = class Task {

  constructor(...actions) {
    this._references = {};
    this._firstActions = [];
    this._lastActions = [];

    if (!actions.length) {
      throw new Error("You must provide at-least one action for a task.")
    }

    this.then(...actions);
  }

  subTask() {
    let task;
    try {
      task = new Task();
    } catch (e) {}

    task._references = this._references;
    task._firstActions = this._lastActions;
    task._lastActions = this._lastActions;

    return task;
  }

  then(...actions) {
    let currentActions = [];

    actions.forEach((action) => {
      if (action instanceof ActionBase) {
        currentActions.push(new action);
        return;
      }

      switch (typeof action) {
        case "string":
          if (!this._references[action]) {
            throw new Error(`Referenced Action not found with key: ${action}`)
          }

          currentActions.push(this._references[action]);
          break;
        case "object":
          for (let [reference, Action] of Object.keys(action)) {
            if (typeof Action !== ActionBase) {
              throw new Error(`Type of 'Action' expected, got '${typeof Action}'.`);
            }

            this._references[reference] = new Action;
            currentActions.push(this._references[reference]);
          }
          break;
        default:
          throw new Error(`Type of ${typeof action} argument is unrecognized.`);
      }
    });

    if (this._firstActions) {
      this._firstActions = currentActions;
    }
    else {
      const promise = this._promiseLast();
      currentActions.forEach((action) => {
        promise.then((param) => {
          action.complete(param);
        });
      })
    }

    this._lastActions = currentActions;
    return this;
  }

  after(reference, ...actions) {
    if (typeof reference == "string") {
      reference = [reference];
    }

    if (Array.isArray(reference)) {
      throw new Error("After reference should be string or array of strings.");
    }

    const saveLast = this._lastActions;
    this._lastActions = reference.map((ref) => {
      if (!this._references[action]) {
        throw new Error(`Referenced Action not found with key: ${action}`)
      }

      return this._references[ref];
    });

    this.then(...actions);
    this._lastActions = saveLast;

    return this;
  }

  ifThen(condition, ...actions) {
    this._lastThen = {
      condition: condition,
      promise: this._promiseLast(),
    };

    this._lastThen.promise.then((param) => {
      if (!condition(param)) {
        return;
      }

      []

      if (typeof actions[0] === "function") {
        actions[0](this.subTask())
      }
      else {

      }
    });
  }

  otherwise(...actions) {

  }

  _promiseLast() {
    return Promise.all(this._lastActions.map((action) => action._promise));
  }

};