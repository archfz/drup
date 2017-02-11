"use strict";

const ActionBase = require("./action");
const TaskData = require("./data");

class ActionReferences {

  constructor() {
    this._references = {};
    this._listeners = [];
  }

  add(key, action) {
    if (typeof key !== "string") {
      throw new Error(`Action reference key must be a string. '${typeof key}' provided.`);
    }

    if (!(action instanceof ActionBase)) {
      throw new Error(`Reference action must be an instance of ActionBase. Got '${typeof action}'.`);
    }

    if (this._references.hasOwnProperty(key)) {
      throw new Error(`Duplicate action reference key: '${key}'`);
    }

    this._references[key] = action;
    this._notifyReferenceAdded(key, action);
  }

  get(key) {
    if (!this._references[key]) {
      throw new Error(`Referenced Action not found with key: ${key}`);
    }

    return this._references[key];
  }

  onAdd(callback) {
    this._listeners.push(callback);
  }

  _notifyReferenceAdded(key, action) {
    this._listeners.forEach((callback) => callback(key, action));
  }

}

module.exports = class Task {

  constructor(...actions) {
    this._references = new ActionReferences();

    this._actionStack = [];
    this._finalPromises = [];

    this._subTasks = [];

    if (!actions.length) {
      throw new Error("You must provide at-least one action for a task.");
    }

    this.then(...actions);
  }

  subTask() {
    let task = new Task("");
    task._references = this._references;
    task._actionStack = [];

    return task;
  }

  then(...actions) {
    this._actionStack.push({
      actions: actions,
    });

    return this;
  }

  after(reference, ...actions) {
    if (typeof reference === "string") {
      reference = [reference];
    }

    if (!Array.isArray(reference)) {
      throw new Error("After reference should be string or array of strings.");
    }

    let subTask = this.subTask();

    if (
      typeof actions[0] === "function" &&
      !(actions[0].prototype instanceof ActionBase)
    ) {
      actions[0](subTask);
    }
    else {
      subTask.then(...actions);
    }

    this._subTasks.push({
      references: reference,
      promises: [],
      task: subTask,
    });

    return this;
  }

  ifThen(condition, ...actions) {
    let subTask = this.subTask();

    if (typeof condition !== "function") {
      throw new Error("Task condition must be a function.");
    }

    if (
      typeof actions[0] === "function" &&
      !(actions[0].prototype instanceof ActionBase)
    ) {
      actions[0](subTask);
    }
    else {
      subTask.then(...actions);
    }

    this._lastIf = {
      condition: condition,
      actions: subTask,
    };

    this._actionStack.push(this._lastIf);

    return this;
  }

  otherwise(...actions) {
    if (!this._lastIf) {
      throw new Error("Otherwise can only be used after ifThen.");
    }

    this.ifThen(() => {}, ...actions);
    this._actionStack[this._actionStack.length - 1].condition = "otherwise";

    this._lastIf = null;

    return this;
  }

  start(initData) {
    this._data = initData instanceof TaskData ? initData : new TaskData(initData);
    this._references.onAdd(this._onReferenceAdded.bind(this));

    let promise = Promise.all(
      this._processActions(this._actionStack.shift().actions)
    );

    let lastConditionStack;

    this._actionStack.forEach((stack) => {
      promise = promise.then(() => {
        if (stack.condition === "otherwise") {
          if (!lastConditionStack.passed) {
            return stack.actions.start(this._data);
          }

          lastConditionStack = null;
        }
        else if (stack.condition) {
          lastConditionStack = stack;
          lastConditionStack.passed = false;

          if (stack.condition(this._data)) {
            lastConditionStack.passed = true;
            return stack.actions.start(this._data);
          }
        }
        else {
          return Promise.all(this._processActions(stack.actions));
        }

        return Promise.resolve();
      });
    });

    return promise
      .then(() => this._awaitAll())
      .then(() => this._data);
  }

  _awaitAll() {
    let promises = this._finalPromises;
    this._finalPromises = [];

    if (!promises.length) {
      return Promise.resolve();
    }

    return Promise.all(promises)
      .then(() => this._awaitAll());
  }

  _onReferenceAdded(key, action) {
    this._subTasks.forEach((subTask) => {
      if (!subTask.references.length) {
        return;
      }

      let refIndex = subTask.references.indexOf(key);
      if (refIndex === -1) {
        return;
      }

      subTask.promises.push(action._promise);
      subTask.references.splice(refIndex, 1);

      if (subTask.references.length) {
        return;
      }

      this._finalPromises.push(
        Promise.all(subTask.promises).then(() => {
          return subTask.task.start(this._data);
        })
      );
    });
  }

  _processActions(actions) {
    let promises = [];

    actions.forEach((action) => {
      if (action.prototype instanceof ActionBase) {
        promises.push(new action(this._data)._promise);
        return;
      }

      switch (typeof action) {
        case "string":
          promises.push(this._references.get(action)._promise);
          break;
        case "object":
          for (let [reference, Action] of Object.entries(action)) {
            if (!(Action.prototype instanceof ActionBase)) {
              throw new Error(`Type of 'Action' expected, got '${typeof Action}': ${Action}`);
            }

            const action = new Action(this._data);
            this._references.add(reference, action);
            promises.push(action._promise);
          }
          break;
        default:
          throw new Error(`Type of '${typeof action}' argument is unrecognized.`);
      }
    });

    return promises;
  }

};
