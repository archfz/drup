"use strict";

const utils = require("../utils");

module.exports = class Action {

  constructor() {
    this.params = {};
    this.parentActions = [];
    this.completedActions = [];

    this.promise = new Promise((resolve) => {
      this._resolve = resolve;
    }).catch((err) => {
      this._chainFailed(err);
    });
  }

  get resultKey() {
    return null;
  }

  start(params) {
    this.params = params;

    Promise((resolve) => {
      this.complete();
      resolve();
    });

    return this.promise;
  }

  resolve(value) {
    if (this.resultKey) {
      this.params[this.resultKey] = value;
    }

    this._resolve(this.params);
  }

  complete(params) {
    utils.mustImplement(this, "start");
  }

  revert() {

  }

  after(action, condition = () => true) {
    this.parentActions.push(action);

    action.promise.then((params) => {
      if (condition(params[action.resultKey])) {
        this._previousCompleted(action, params);
      }
    });

    return this;
  }

  static after() {
    return new (this.constructor)().after.call(arguments);
  }

  _chainFailed(err) {
    this.revert(err);

    this.parentActions.forEach((action) => {
      action._chainFailed(err);
    });
  }

  _previousCompleted(action, params) {
    if (action.resultKey) {
      this.params[action.resultKey] = params[action.resultKey];
    }

    this.completedActions.push(action);

    if (this.parentActions.length === this.completedActions.length) {
      this.complete(this.params);
    }
  }

};