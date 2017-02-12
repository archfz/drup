"use strict";

const Terminal = require("./smart_term")();
const BottomLine = require("./bottom_line");

const states = [">  ", " > ", "  >"];
const FINISHED_MESSAGE = "[FINISHED]";

function trim(string, max) {
  string = string.replace(/\n|\r/g, "");
  string = "| " + string.substr(string.search(/[a-zA-Z0-9]/));

  if (string.length > max) {
    return string.substr(0, max - 2) + "..";
  } else {
    return string + " ".repeat(max - string.length);
  }
}

/**
 * Class AsyncLoader.
 *
 * Using the smart terminal and bottom line handlers provides a loader that
 * is always on the bottom on the page and is multi stack-able.
 */
class AsyncLoader {

  /**
   * AsyncLoader constructor.
   *
   * @param {string} message
   *    The message to display.
   * @param {int} speed
   *    Time difference between rendering in ms.
   */
  constructor(message = "Loading..", speed = 100) {
    this.state = 0;
    this.speed = speed;
    this.setMessage(message);

    this.line = new BottomLine(this._render.bind(this));

    this.loaderInterval = setInterval((function() {
      this.state += 1;
      if (this.state > 2) {
        this.state = 0;
      }

      this.line.render();
    }).bind(this), this.speed);
  }

  /**
   * Sets the message of the loader.
   *
   * @param {string} message
   *    The message.
   */
  setMessage(message) {
    this.originalMessage = message;
    this.message = message;

    this.line && this.line.render();
  }

  /**
   * Render callback for the bottom line.
   *
   * @param terminalWidth
   *    The current number of columns in the terminal.
   *
   * @returns {string}
   *    The render string.
   */
  _render(terminalWidth) {
    const messageLength = Math.round(terminalWidth / 2.5);
    let length = terminalWidth - messageLength - 3;
    if (length < 0) {
      return "";
    }

    let bar = states[this.state].repeat(length / 3).substr(0, length);
    return trim(this.message, messageLength) + (" ║" + bar + "║").yellow;
  }

  /**
   * Finishes the loader with a message.
   *
   * @param {string} message
   *    The message to finish with.
   *
   * @param {int} timeout
   *    How many ms to stay visible.
   */
  finish(message, timeout = 3000) {
    clearInterval(this.loaderInterval);
    message = trim(message || this.originalMessage,
      Terminal.width() - (FINISHED_MESSAGE.length + 1));

    this.line.setOutputCallback(function(){
      return message.green + FINISHED_MESSAGE.green;
    }).render();

    setTimeout(function(){
      this.line.destroy();
      delete this;
    }.bind(this), timeout);
  }

  /**
   * Destroys the loader.
   */
  destroy() {
    clearInterval(this.loaderInterval);
    this.line.destroy();
  }

}

module.exports = AsyncLoader;
