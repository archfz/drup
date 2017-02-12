"use strict";

const ActionBase = require("./action");
const TaskData = require("./data");

/**
 * Class ActionRunner.
 *
 * Provides a helper for tasks to start actions and keep references.
 */
class ActionRunner {

  constructor() {
    this._running = [];
    this._completed = [];
    this._references = {};
    this._listeners = {
      reference: [],
      fail: [],
    };
  }

  /**
   * Starts an action
   *
   * @param {ActionBase} action
   *    The action to start.
   * @param {TaskData} data
   *    The task data to pass to the action.
   * @param {string} reference
   *    Optionally reference the action.
   *
   * @returns {Promise}
   *    The action's promise or a rejected promise with error.
   */
  start(action, data, reference = "") {
    if (this._err) {
      return Promise.reject(this._err);
    }

    if (!(action.prototype instanceof ActionBase)) {
      throw new Error(`Type of 'Action' expected, got '${typeof action}': ${action}`);
    }

    let act = new action(data);
    this._running.push(act);

    let promise = act._promise
      .catch((err) => {
        // If this action fails revert it right away and remove from running
        // so that it doesn't interfere with the other running tasks.
        act.revert(act._data);
        this._running.splice(this._running.indexOf(act), 1);

        err.message = `Action '${act.constructor.name}' failed:\n${err.message}`;

        this._fail(err);
      })
      .then(() => {
        this._completed.push(act);

        // Only remove from the running if there were no errors, so that if
        // there was we can identify the actions that were running when an error
        // occurred.
        if (!this._err) {
          this._running.splice(this._running.indexOf(act), 1);
        }
      });

    if (reference !== "") {
      if (typeof reference !== "string") {
        throw new Error(`Action reference key must be a string. '${typeof reference}' provided.`);
      }

      if (this._references.hasOwnProperty(reference)) {
        throw new Error(`Duplicate action reference key: '${reference}'`);
      }

      this._references[reference] = act;
      // Notify all listeners that a new action was referenced.
      this._notifyReferenceAdded(reference, act);
    }

    return promise;
  }

  /**
   * Gets a referenced action.
   *
   * @param {string} key
   *    The name of the reference.
   *
   * @returns {ActionBase}
   */
  get(key) {
    if (!this._references[key]) {
      throw new Error(`Referenced Action not found with key: ${key}`);
    }

    return this._references[key];
  }

  /**
   * Adds fail listener.
   *
   * @param {Function} callback
   *    The function to be called when a action fails. Will receive the error.
   */
  onFail(callback) {
    this._listeners.fail.push(callback);
  }

  /**
   * Fail the action chain, revert all completed actions and notify listeners.
   *
   * @param {Error} err
   *    The error that caused the failure.
   * @private
   */
  _fail(err) {
    if (this._err) {
      return;
    }

    this._err = err;

    // Start reverting completed actions and collect their promises.
    let revertPromises = [];
    this._completed.forEach((action) => {
      const promise = action.revert(action._data);

      if (promise instanceof Promise) {
        revertPromises.push(promise)
      }
    });

    // Await running actions to finish then revert them as-well.
    const awaitRevert = Promise.all(this._running.map((act) => act._promise))
      .then(() => {
        let promises = [];

        this._running.forEach((action) => {
          const promise = action.revert(action._data);

          if (promise instanceof Promise) {
            promises.push(promise)
          }
        });
      });

    // Add the awaiting reverts.
    revertPromises.push(awaitRevert);

    // Create the final promise and send to listeners.
    const awaitReverts = Promise.all(revertPromises);
    this._listeners.fail.forEach((callback) => callback(awaitReverts));
  }

  /**
   * Adds reference addition listener.
   *
   * @param {Function} callback
   *    The function to be called on the event. This will get as parameters
   *    the reference name and the action.
   */
  onReference(callback) {
    this._listeners.reference.push(callback);
  }

  /**
   * Notifies all listeners of a new referenced action.
   *
   * @param {string} key
   *    The name of the reference.
   * @param {ActionBase} action
   *    The referenced action.
   * @private
   */
  _notifyReferenceAdded(key, action) {
    this._listeners.reference.forEach((callback) => callback(key, action));
  }

}

/**
 * Class Task.
 *
 * Provides a wrapping mechanism over promises. It allows for easy chaining in
 * the form of graphs for actions {ActionBase}, that provide a promise to
 * complete something. It also handles the reverting of completed actions if
 * any fail in the chain.
 */
class Task {

  /**
   * Task constructor.
   *
   * @param {ActionBase[]|Object} actions
   *    Action classes, optionally referenced. Any number of actions can be
   *    provided. Referenced actions need to be provided in the format of
   *    object where the key is the reference name and the value is the action
   *    class: {referenceKey: MyAction, ..}.
   */
  constructor(...actions) {
    // Helper to start, revert and reference actions.
    // This will persist for sub-tasks.
    this._actionRunner = new ActionRunner();

    // Stores all parallel actions on each row.
    this._actionStack = [];
    // Stores all sub-tasks that will ran.
    this._subTasks = [];
    // Keeps track of started actions.

    if (!actions.length) {
      throw new Error("You must provide at-least one action for a task.");
    }

    // Add the initial action(s).
    this.then(...actions);
  }

  /**
   * Creates a sub-task of this task.
   *
   * @returns {Task}
   *    The sub-task.
   */
  subTask() {
    let task = new Task("");
    // Make sure the sub-task has access to the same started actions and
    // references.
    task._actionRunner = this._actionRunner;
    // Reset the action stack as we want to start clean.
    task._actionStack = [];

    return task;
  }

  /**
   * Adds the provided actions on top of the stack to be ran parallel.
   *
   * These will be ran after the previous action's promises on the stack
   * all get resolved.
   *
   * @param {string|ActionBase|Object} actions
   *    All this formats can be combined and any amount provided:
   *    - string: will add to this stack a referenced action
   *    - Object: {reference: ActionBase}, this adds a reference action
   *    - ActionBase: the simple format
   *
   * @returns {Task}
   *    Self.
   */
  then(...actions) {
    this._actionStack.push({
      actions: actions,
    });

    return this;
  }

  /**
   * Creates a sub-task that will only be ran after the provided references.
   *
   * @param {string|Array} reference
   *    A reference or an array of references.
   * @param {Function|string|ActionBase|Object} actions
   *    Refer to then() for documentation.
   *    Additionally a callback can be provided for more complicated sub-task
   *    that will receive the sub-task.
   *
   * @returns {Task}
   *    Returns NOT the sub-task, but self, with unmodified action stack.
   */
  after(reference, ...actions) {
    if (typeof reference === "string") {
      reference = [reference];
    }

    if (!Array.isArray(reference)) {
      throw new Error("After reference should be string or array of strings.");
    }

    let subTask = this.subTask();

    // Allow for callback so that more than one stack of actions can be added.
    // But still allow for short usage of just one stack.
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

  /**
   * Creates a sub-task that will only be ran if the condition passes.
   *
   * The condition is executed after the previously added stack has completed.
   * In case the condition passes the sub-task will be chained with the next
   * stack in this task, if any.
   *
   * @param {Function} condition
   *    The condition callback that will receive the task data object.
   *    Should return boolean.
   * @param {Function|string|ActionBase|Object} actions
   *    Refer to after() documentation.
   *
   * @returns {Task}
   *    Self.
   */
  ifThen(condition, ...actions) {
    let subTask = this.subTask();

    if (typeof condition !== "function") {
      throw new Error("Task condition must be a function.");
    }

    // Allow for callback so that more than one stack of actions can be added.
    // But still allow for short usage of just one stack.
    if (
      typeof actions[0] === "function" &&
      !(actions[0].prototype instanceof ActionBase)
    ) {
      actions[0](subTask);
    }
    else {
      subTask.then(...actions);
    }

    // Remember the last if then so that the otherwise can be used.
    this._lastIf = {
      condition: condition,
      actions: subTask,
    };

    this._actionStack.push(this._lastIf);

    return this;
  }

  /**
   * Creates a sub-task that will be ran if the previous if then didn't pass.
   *
   * This method can only be used if the ifThen was previously used.
   *
   * @param {Function|string|ActionBase|Object} actions
   *    Refer to after() documentation.
   *
   * @returns {Task}
   *    Self.
   */
  otherwise(...actions) {
    if (!this._lastIf) {
      throw new Error("Otherwise can only be used after ifThen.");
    }

    // Chain it to the ifThen as we are basically doing the same thing.
    this.ifThen(() => {}, ...actions);
    // Mark the condition special so the executor will know what to check.
    this._actionStack[this._actionStack.length - 1].condition = "otherwise";

    // Unset the last if so no more otherwise can be added.
    this._lastIf = null;

    return this;
  }

  /**
   * Start to solving the task.
   *
   * @param {Object|TaskData} initData
   *    Object containing initial data for the task.
   *
   * @returns {Promise.<TaskData>}
   *    A promise that will only resolve when all actions of this task and
   *    every sub-task has been resolved. The final data object will be passed.
   */
  start(initData) {
    // Stores promises of sub-tasks so that we can await them for this task.
    this._finalPromises = [];

    this._data = initData instanceof TaskData ? initData : new TaskData(initData);
    // Listen to references being added by this task or any sub-task.
    this._actionRunner.onReference(this._onReferenceAdded.bind(this));

    // Process first stack of actions to build the initial promise.
    let promise = Promise.all(
      this._processActions(this._actionStack.shift().actions)
    );

    let lastConditionStack;

    // Now that we have the first parallel set of promises we can go through all
    // and chain them.
    this._actionStack.forEach((stack) => {
      // Make sure actions and sub-task are lazy-added by only instantiating
      // them when the previous stack finished and all conditions are met.
      promise = promise.then(() => {
        // Handled the case of otherwise sub-tasks.
        if (stack.condition === "otherwise") {
          if (!lastConditionStack.passed) {
            // Start the sub-task.
            return stack.actions.start(this._data);
          }

          lastConditionStack = null;
        }
        // Handled the case of conditional sub-tasks.
        else if (stack.condition) {
          lastConditionStack = stack;
          lastConditionStack.passed = false;

          if (stack.condition(this._data)) {
            lastConditionStack.passed = true;
            // Start the sub-task.
            return stack.actions.start(this._data);
          }
        }
        // The simple stack action handling.
        else {
          return Promise.all(this._processActions(stack.actions));
        }

        // TODO: what?
        return Promise.resolve();
      });
    });

    // Make sure we await all sub-task, especially the ones that are lazy
    // started by references. At the end return the data.
    return promise
      .then(() => this._awaitAll())
      .then(() => {
        // Check if there was an error and if yes forward it.
        if (this._actionRunner._err) {
          throw this._actionRunner._err;
        }
      })
      .then(() => this._data);
  }

  /**
   * Registers a callback for when reverting is initiated.
   *
   * @param callback
   *    Callback function that will called on fail and will receive a promise
   *    that will resolve when all actions reverted.
   *
   * @return {Task}
   *    Self.
   */
  onReverting(callback) {
    this._actionRunner.onFail(callback);
    return this;
  }

  /**
   * Awaits all actions and sub-tasks.
   *
   * This will recall itself in the promise chain until it won't find any
   * promises in the _finalPromises.
   *
   * @returns {Promise}
   *    Promise that either is resolved as there is nothing to wait for anymore,
   *    or a promises of all actions and sub-task that were present in this
   *    moment.
   * @private
   */
  _awaitAll() {
    let promises = this._finalPromises;
    this._finalPromises = [];

    if (!promises.length) {
      return Promise.resolve();
    }

    // When the current final promises finish there might be new final promises
    // added so recall self.
    return Promise.all(promises)
      .then(() => this._awaitAll());
  }

  /**
   * Listens to referenced actions being started.
   *
   * Makes sure that after sub-tasks are started if the provided references
   * complete. This can only be done if those referenced actions all get
   * started so that they have a promise.
   *
   * @param {string} key
   *    The name of the reference.
   * @param {ActionBase} action
   *    The referenced action started.
   * @private
   */
  _onReferenceAdded(key, action) {
    // Loop all sub-task of this task and see if they can be prepared to start.
    this._subTasks.forEach((subTask) => {
      // If we have no references left it means that the sub-task started.
      if (!subTask.references.length) {
        return;
      }

      // Find out whether this sub-task required the added reference.
      let refIndex = subTask.references.indexOf(key);
      if (refIndex === -1) {
        return;
      }

      // Store the promise for the sub-task so it can then react to it.
      subTask.promises.push(action._promise);
      // Register that this reference was added.
      subTask.references.splice(refIndex, 1);

      // If there are more references that weren't started, then wait.
      if (subTask.references.length) {
        return;
      }

      // If all the required referenced actions started then we can queue the
      // sub-task for starting. We also add this promise to the final promises
      // to make sure this task await for the sub-task.
      this._finalPromises.push(
        Promise.all(subTask.promises).then(() => {
          return subTask.task.start(this._data);
        })
      );
    });
  }

  /**
   * Processes a stack of actions.
   *
   * @param {Array} actions
   *    Array of actions to start and add to a stack of promises.
   * @returns {Promise[]}
   *    All the provided actions promises.
   * @private
   */
  _processActions(actions) {
    let promises = [];

    actions.forEach((action) => {
      // If this a simple action then just add it's promises and continue.
      if (action.prototype instanceof ActionBase) {
        promises.push(this._actionRunner.start(action, this._data));
        return;
      }

      switch (typeof action) {
        // If we get a string it means that we got a reference.
        case "string":
          // Add the referenced action's promise.
          promises.push(this._actionRunner.get(action)._promise);
          break;
        // In case of object we got actions that should be referenced.
        case "object":
          // The object may contain multiple referenced actions.
          for (let [reference, Action] of Object.entries(action)) {
            if (!(Action.prototype instanceof ActionBase)) {
              throw new Error(`Type of 'Action' expected, got '${typeof Action}': ${Action}`);
            }

            // Add the reference. This in turn will notify all sub-tasks,
            // super-tasks and this task.
            const promise = this._actionRunner.start(Action, this._data, reference);
            promises.push(promise);
          }
          break;
        default:
          throw new Error(`Type of '${typeof action}' argument is unrecognized.`);
      }
    });

    return promises;
  }

}

module.exports = Task;
