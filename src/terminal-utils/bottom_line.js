"use strict";

const Terminal = require("./smart_term")();
const stripAnsi = require("strip-ansi");

/**
 * Bottom lines manager.
 */
const BottomLines = {
  // Stores all registered bottom lines.
  bottomLines : [],

  /**
   * Get the index of a registered bottom line.
   *
   * @param {BottomLine} bottomLine
   *    For which to get the index.
   *
   * @returns {number}
   */
  getLineIndex(bottomLine) {
    return this.bottomLines.indexOf(bottomLine);
  },

  /**
   * Get the number of bottom lines.
   *
   * @returns {Number}
   */
  count() {
    return this.bottomLines.length;
  },

  /**
   * Register a bottom line object.
   *
   * @param {BottomLine} bottomLine
   */
  register(bottomLine) {
    this.bottomLines.push(bottomLine);

    if (this.count() == 1) {
      this.renderCall = this.renderAll.bind(this);
      this.removeCall = this.removeAll.bind(this);
      this.cleanCall = this.cleanUp.bind(this);

      Terminal.on("before_write", this.cleanCall);
      Terminal.on("after_write", this.renderCall);
      Terminal.on("exit", this.removeCall);
    }
  },

  /**
   * Remove a bottom line.
   *
   * @param {BottomLine} bottomLine
   */
  remove(bottomLine) {
    let i = this.getLineIndex(bottomLine);
    if (i === -1) {return;}

    this.cleanUp();
    this.bottomLines.splice(i, 1);

    if (this.count()) {
      this.renderAll();
    } else {
      Terminal.stopOn("before_write", this.cleanCall);
      Terminal.stopOn("after_write", this.renderCall);
      Terminal.stopOn("exit", this.removeCall);
    }
  },

  /**
   * Renders all bottom lines registered at the bottom of the terminal.
   */
  renderAll() {
    let lines = this.count();

    let visibilityStateChanged = Terminal.hideCursor();
    Terminal.ensureEmptyLines(lines);

    Terminal.charm("push", 1);
    Terminal.setCursorToLine(lines - 1);

    let render = "";
    for (let i = this.count() - 1; i >= 0; --i) {
      render += this.bottomLines[i].getOutput() + "\n";
    }
    Terminal.nativeWrite(render.slice(0, -1));

    Terminal.charm("pop", 1);
    visibilityStateChanged && Terminal.showCursor();
  },

  /**
   * Removes all bottom lines.
   */
  removeAll() {
    let lines = this.count();

    let line;
    while(line = this.bottomLines.pop()) {
      line.destroy();
    }

    this.cleanUp(lines);
    this.bottomLines = [];
  },

  /**
   * Does a clean up of the rendered bottom lines.
   *
   * @param {number} lines
   *    Count of lines to clear (optional).
   */
  cleanUp(lines) {
    lines = lines || this.count();

    Terminal.charm("push", 1);
    Terminal.setCursorToLine(lines - 1);
    Terminal.charm("erase", "down");
    Terminal.charm("pop", 1);
  }

};


/**
 * Bottom line object handler.
 */
class BottomLine {

  /**
   * BottomLine constructor.
   *
   * @param {Function} outputCallback
   *    The callback function from which the rendered text will be acquired.
   */
  constructor(outputCallback) {
    this.setOutputCallback(outputCallback);
    BottomLines.register(this);

    Terminal.ensureEmptyLines(BottomLines.count());
  }

  /**
   * Sets the output callback function.
   *
   * @param {Function} callback
   *    The callback function from which the rendered text will be acquired.
   *
   * @returns {BottomLine}
   */
  setOutputCallback(callback) {
    if (typeof callback !== "function") {
      throw new Error("You must provide a callback function that returns output.");
    }
    this.requestOutput = callback;
    return this;
  }

  /**
   * Gets the output render.
   *
   * @returns {string}
   */
  getOutput() {
    // In case of windows the cursor will jump to next line if full width
    // written, so subtract some.
    let width = Terminal.width() - 1;
    let output = this.requestOutput(width) || "";

    let length = stripAnsi(output);

    if (length > width) {
      throw new Error("The output length should be less than the terminal width.");
    } else if (length < width) {
      output += " ".repeat(width - length);
    }

    return output;
  }

  /**
   * Renders the text to the terminal line.
   */
  render() {
    let visibilityStateChanged = Terminal.hideCursor();
    Terminal.charm("push", 1);

    let line = BottomLines.getLineIndex(this);
    Terminal.setCursorToLine(line);
    Terminal.nativeWrite(this.getOutput());

    Terminal.charm("pop", 1);
    visibilityStateChanged && Terminal.showCursor();
  }

  /**
   * Removes this line and stops rendering.
   */
  destroy() {
    BottomLines.remove(this);
  }

}

module.exports = BottomLine;
