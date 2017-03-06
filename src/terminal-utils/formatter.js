"use strict";

const util = require("util");
const colors = require("colors");

const consoleLog = console.log;
const consoleWarn = console.warn;
const consoleError = console.error;

function padd(str, length = process.stdout.columns) {
  return str + " ".repeat(length - str.length % length);
}

const Formatter = module.exports = {

  tab(str = "", x = 1) {
    let tab = "  ".repeat(x);
    let cols = process.stdout.columns - tab.length;

    let match = str.match(new RegExp(`.{1,${cols}}|\n`, "g"));
    str = match ? match.join(tab) : str;

    return tab + str;
  },

  heading(str, marker = "»".blue, color2 = "cyan") {
    consoleLog();
    consoleLog(marker + " " + str.toUpperCase()[color2]);
    consoleLog("  " + "¨".repeat(process.stdout.columns - 3)[color2]);
  },

  list(items, inset = 0, color = "green") {
    const insetTab = "  ".repeat(inset) + "• "[color];

    if (Array.isArray(items)) {
      items.forEach((item) => {
        consoleLog(this.tab(item).replace(/ /, insetTab));
      });
    }
    else if (typeof items === "object") {
      for (let [key, text] of Object.entries(items)) {
        consoleLog(insetTab + key[color]);

        if (typeof text !== "string") {
          this.list(text, (inset || 0) + 1, color);
        }
        else {
          consoleLog(this.tab(text, inset + 2));
        }
      }
    }
    else if (typeof items === "string") {
      consoleLog(insetTab + items);
    }
  },

  error(error) {
    consoleLog();
    Formatter.heading("ERROR", "!!".red, "red");

    if (!(error instanceof Error)) {
      return consoleError(error);
    }

    let firstBreak = error.message.indexOf("\n");
    if (firstBreak === -1) {
      firstBreak = error.message.length;
    }

    let errorBody = error.message.substr(firstBreak).replace(/\n(.)/g, "\n  • ".red + "$1");

    consoleError(error.message.substr(0, firstBreak));
    consoleError(errorBody);

    Formatter.heading("STACK TRACE", ">>".yellow, "yellow");
    consoleError(error.stack.substr(error.stack.indexOf("    at ")).replace(/    /g, "  • ".yellow));
  },

  warn(str) {
    Formatter.heading("WARNING", "!".yellow, "yellow");
    consoleWarn(str);
  },

  infect() {
    console.log = function(str, ...args) {
      str = str || "";

      if (typeof str === "string") {
        if (args) {
          str = util.format(str, ...args);
        }

        const headingMatch = str.match(/.{2}/);
        if (str.length > 2 && headingMatch[0] === "--") {
          Formatter.heading(str.substr(headingMatch.index + 2));
          return;
        }
      }

      consoleLog(str);
    };

    console.error = function(str, ...args) {
      str = str || "";

      if (typeof str === "string" && args) {
        str = util.format(str, ...args);
      }

      Formatter.error(str);
    };

    console.warn = function(str, ...args) {
      str = str || "";

      if (typeof str === "string" && args) {
        str = util.format(str, ...args);
      }

      Formatter.warn(str);
    };
  },
};
