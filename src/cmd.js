"use strict";

require("colors");

function padd(str, length = process.stdout.columns) {
  return str + " ".repeat(length - str.length % length);
}

module.exports = {

  error(error) {

    let length = process.stdout.columns;

    let firstBreak = error.message.indexOf("\n");
    if (firstBreak === -1) {
      firstBreak = error.message.length;
    }

    let errorHead = (" " + error.message.substr(0, firstBreak)).match(new RegExp(`.{1,${length - 1}}`, "g"));
    let errorBody = error.message.substr(firstBreak).replace(/\n(.)/g, "\n  • ".red + "$1");

    console.error("\n !ERROR ".bgRed + "•".repeat(length - 8).red);
    console.error(padd(errorHead.join("\n")).bgRed.white);
    console.error(errorBody);

    console.error("\n !STACK TRACE ".bgYellow.black + "•".repeat(length - 14).yellow);
    console.error(error.stack.substr(error.stack.indexOf("    at ")).replace(/    /g, "  • ".yellow));
  },

  warning(msg) {
    console.log("! Warning: ".yellow + msg);
  },

  info(msg) {
    console.log("├╼ ".blue + msg);
  },

  heading(msg) {
    console.log("\n┌ ".blue + msg.toUpperCase().green + " ┐".blue);

    let line = "├─────────────────────────────────────────────────";
    console.log((line.substr(0, msg.length + 3) + "┘").blue);
  }

};