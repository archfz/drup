"use strict";

const Terminal = require("./smart_term")();
const BottomLine = require("./bottom_line");

const MAX_MESSAGE_LENGTH = 20;
const states = [">  ", " > ", "  >"];
const FINISHED_MESSAGE = "[FINISHED]";

function trim(string, max) {
  if (string.length > max) {
    return string.substr(0, max - 2) + "..";
  } else {
    return string + " ".repeat(max - string.length);
  }
}

module.exports = class AsyncLoader {

  constructor(message = "Loading..", speed = 100) {
    this.state = 0;
    this.speed = speed;
    this.setMessage(message);

    this.line = new BottomLine(this.render.bind(this));

    this.loaderInterval = setInterval((function() {
      this.state += 1;
      if (this.state > 2) {
        this.state = 0;
      }

      this.line.render();
    }).bind(this), this.speed);
  }

  setMessage(message) {
    this.originalMessage = message;
    this.message = trim(message, MAX_MESSAGE_LENGTH);

    this.line && this.line.render();
  }

  render(terminalWidth) {
    let length = terminalWidth - MAX_MESSAGE_LENGTH - 3;
    if (length < 0) {
      return "";
    }

    let bar = states[this.state].repeat(length / 3).substr(0, length);
    return this.message + (" ║" + bar + "║").yellow;
  }

  finish(message) {
    clearInterval(this.loaderInterval);
    message = trim(message || this.originalMessage,
      Terminal.width() - (FINISHED_MESSAGE.length + 1));

    this.line.setOutputCallback(function(){
      return message.green + FINISHED_MESSAGE.green;
    }).render();

    setTimeout(function(){
      this.line.destroy();
      delete this;
    }.bind(this), 4000);
  }
};
