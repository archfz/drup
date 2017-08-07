"use strict";

const util = require("util");
const colors = require("colors");

const consoleLog = console.log;
const consoleWarn = console.warn;
const consoleError = console.error;

const EError = require("../eerror");

function padd(str, length = process.stdout.columns) {
  return str + " ".repeat(length - str.length % length);
}

/**
 * Terminal output formatter that makes output colorful and organized.
 */
const Formatter = module.exports = {

  /**
   * Adds tabs to the given text.
   *
   * @param {string} str
   *    The text to tab.
   * @param {number} x
   *    Amount of tabs to add.
   *
   * @returns {string}
   *    Tabbed text.
   */
  tab(str = "", x = 1) {
    let tab = "  ".repeat(x);
    let cols = process.stdout.columns - tab.length;

    let match = str.match(new RegExp(`.{1,${cols}}|\n`, "g"));
    str = match ? match.join(tab) : str;

    return tab + str;
  },

  /**
   * Formats given text into a heading.
   *
   * @param {string} str
   *    The heading text.
   * @param {string} marker
   *    Heading character.
   * @param {string} color2
   *    The color of the heading.
   */
  heading(str, marker = "»".blue, color2 = "cyan") {
    consoleLog();
    consoleLog(marker + " " + str.toUpperCase()[color2]);
    consoleLog("  " + "¨".repeat(process.stdout.columns - 3)[color2]);
  },

  /**
   * Prints given items in list format.
   *
   * @param {Array|Object|string} items
   *    The items to print.
   * @param {number} inset
   *    The tabbing.
   * @param {string} color
   *    Color of the item text.
   */
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

  /**
   * Prints formatted errors.
   *
   * @param {Error|string} error
   *    The error to print.
   */
  error(error) {
    consoleLog();

    // Handling extended errors which provided in better format error data.
    if (error instanceof EError) {
      consoleLog();
      consoleLog("!! ERROR ".red + "& STACK".yellow);
      consoleLog("  ¨¨¨¨¨¨ ".red + "¨".yellow.repeat(process.stdout.columns - "  ¨¨¨¨¨¨ ".length) + "\n");

      let messageNum = 0;
      error.getStackedErrors().forEach((error) => {
          error.messages.forEach((message, i) => {
            console.log((i === 0 ? (" #" + (++messageNum)).red : "   ") + " " + message)
          });
          error.stacks.forEach((stack) => console.log("  • ".yellow + stack.gray));
          console.log();
      });

      return;
    }

    // Handling for default errors.
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

  /**
   * Prints formatted warning.
   *
   * @param {string} str
   *    Warning text.
   */
  warn(str) {
    Formatter.heading("WARNING", "!".yellow, "yellow");
    consoleWarn(str);
  },

  /**
   * Registers listeners for formatting text from recognized tags.
   */
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
      // Used for exit codes. Errors can specify error codes.
      if (str instanceof Error && Number.isInteger(str.code)) {
        return str.code;
      }
      // If not an error object then default to 1.
      return 1;
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
