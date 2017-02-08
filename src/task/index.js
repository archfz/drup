"use strict";

const ActionBase = require('./action');

class TaskData {

  constructor(data) {
    if (typeof data !== "object") {
      throw new Error("Task initial data must be of type object.");
    }

    this.data = data;
  }

  get(selector) {
    let path = selector.split(".");
    let variable = this.data;

    for (let i = 0; i < path.length; i++) {
      if (!variable.hasOwnProperty(path[i])) {
        return null;
      }

      variable = variable[path[i]];
    }

    return variable;
  }

  set(selector, value) {
    let path = selector.split(".");
    let _data = this.data;

    for (let i = 0, l = path.length; i < l; i++) {
      let p = path[i];

      if (!_data.hasOwnProperty(p)) {
        if (i === l - 1) {
          _data[p] = value;
          break;
        } else {
          _data[p] = {};
        }
      } else if (i === l - 1) {
        _data[p] = value;
        break;
      }

      _data = _data[p];
    }
  }

}

module.exports = class Task {

  constructor(...actions) {
    this._references = {};
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

    return promise.then(() => {
      return Promise.all(this._finalPromises);
    }).then(() => this._data);
  }

  _addReferenceAction(reference, Action) {
    this._references[reference] = Action;

    this._subTasks.forEach((task) => {
      if (!task.references.length) {
        return;
      }

      let refIndex = task.references.indexOf(reference);
      if (refIndex === -1) {
        return;
      }

      task.promises.push(Action._promise);
      task.references.splice(refIndex, 1);

      if (!task.references.length) {
        this._finalPromises.push(
          Promise.all(task.promises).then(() => {
            return task.task.start(this._data);
          })
        );
      }
    });

    return Action;
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
          if (!this._references[action]) {
            throw new Error(`Referenced Action not found with key: ${action}`);
          }

          promises.push(this._references[action]._promise);
          break;
        case "object":
          for (let [reference, Action] of Object.entries(action)) {
            if (!(Action.prototype instanceof ActionBase)) {
              throw new Error(`Type of 'Action' expected, got '${typeof Action}': ${Action}`);
            }


            promises.push(
              this._addReferenceAction(reference, new Action(this._data))
            );
          }
          break;
        default:
          throw new Error(`Type of '${typeof action}' argument is unrecognized.`);
      }
    });

    return promises;
  }

};