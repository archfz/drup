"use strict";

const Terminal = require("./smart_term")();
const stripAnsi = require("strip-ansi");

const BottomLines = {
  bottomLines : [],
  allowRender : true,

  getLineIndex(bottomLine) {
    return this.bottomLines.indexOf(bottomLine);
  },

  count() {
    return this.bottomLines.length;
  },

  register(bottomLine) {
    this.bottomLines.push(bottomLine);

    if (this.count() === 1) {
      this.renderCall = this.renderAll.bind(this);
      this.removeCall = this.removeAll.bind(this);
      this.cleanCall = this.cleanUp.bind(this);
      this.resizeCall = this.terminalResize.bind(this);

      Terminal.on("before_write", this.cleanCall);
      Terminal.on("after_write", this.renderCall);
      Terminal.on("exit", this.removeCall);
      process.stdout.on("resize", this.resizeCall);
    }
  },

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

  renderAll() {
    if (!this.allowRender) {
      return;
    }

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

  removeAll() {
    let lines = this.count();

    let line;
    while(line = this.bottomLines.pop()) {
      line.destroy();
    }

    this.cleanUp(lines);
    this.bottomLines = [];
  },

  cleanUp(lines) {
    lines = lines || this.count();

    Terminal.charm("push", 1);
    Terminal.setCursorToLine(lines - 1);
    Terminal.charm("erase", "down");
    Terminal.charm("pop", 1);
  },

  terminalResize() {
    clearTimeout(this._continueTimeout);

    this.allowRender = false;
    this.cleanUp();
    this._continueTimeout = setTimeout(() => this.allowRender = true, 400);
  }

};

module.exports = class BottomLine {
  constructor(outputCallback) {
    this.setOutputCallback(outputCallback);
    BottomLines.register(this);

    Terminal.ensureEmptyLines(BottomLines.count());
  }

  setOutputCallback(callback) {
    if (typeof callback !== "function") {
      throw new Error("You must provide a callback function that returns output.");
    }
    this.requestOutput = callback;
    return this;
  }

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

  render() {
    if (!BottomLines.allowRender) {
      return;
    }

    let visibilityStateChanged = Terminal.hideCursor();
    Terminal.charm("push", 1);

    let line = BottomLines.getLineIndex(this);
    Terminal.setCursorToLine(line);
    Terminal.nativeWrite(this.getOutput());

    Terminal.charm("pop", 1);
    visibilityStateChanged && Terminal.showCursor();
  }

  destroy() {
    BottomLines.remove(this);
  }
};