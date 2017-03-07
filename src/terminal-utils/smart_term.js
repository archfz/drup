"use strict";

const charm = require("charm")();
const encode = require("charm/lib/encode");
const stripAnsi = require("strip-ansi");

// Visible characters that move the cursor.
const VISIBLE_REGEX_G = /[\u0020-\u007e\u00a0-\u00ff]/gi;
// ANSI escape sequences that move the cursor.
const ANSI_MOVE_REGEX = /[\u001b\u009b][\[]([0-9]+)([ABCDG])/;
// ANSI escape sequences that set the cursor visibility.
const ANSI_VISIBLITY_REGEX = /[\u001b\u009b]\[\?25([hl])/;

let JSTermInitialized = false;

let nativeWrite = {
  out: process.stdout.write.bind(process.stdout),
  err: process.stderr.write.bind(process.stderr),
};

let cursor = { x: 0, y: 0, n: 0 };
let isCursorVisible = true;

let totalChars = 0;
let inputIndex = 0;

let events = {};

const SmartTerminal = {

  /**
   * Gets terminal width.
   *
   * @returns {Number}
   */
  width() {
    return process.stdout.columns;
  },

  /**
   * Gets terminal height.
   *
   * @returns {Number}
   */
  height() {
    return process.stdout.rows;
  },

  ///////////////////////////
  // CURSOR METHODS
  ///////////////////////////

  /**
   * Sets the cursor position to the number of visible characters.
   *
   * @param n(optional)
   */
  updateCursorPosition(n) {
    n = (typeof n !== "undefined" ? n : (totalChars + inputIndex));

    let y = Math.floor(n / this.width());
    let x = n % this.width();

    if (cursor.y !== y){
      if (cursor.y > y) {
        this.charm("up", cursor.y - y);
      } else if (cursor.y < y) {
        this.charm("down", y - cursor.y);
      }
    }

    this.charm("column", x + 1);

    cursor = {x:x, y:y, n:n};
  },

  /**
   * Sets the cursor to absolute line from top.
   *
   * @param line
   * @param direction
   */
  setCursorToLine(line, direction = "bottom") {
    if (direction === "bottom") {
      line = this.height() - line;
    } else {
      ++line;
    }

    this.charm("position", 1, line);
    return this;
  },

  /**
   * Check whether cursor is visible.
   *
   * @returns {boolean}
   */
  isCursorVisible() {
    return isCursorVisible;
  },

  /**
   * Shows the terminal cursor.
   *
   * @returns {Boolean}
   *  Whether the state was changed.
   */
  showCursor() {
    if (isCursorVisible) {
      return false;
    }

    this.nativeWrite("\x1B[?25h");
    isCursorVisible = true;
    return true;
  },

  /**
   * Hides the terminal cursor.
   *
   * @returns {Boolean}
   *  Whether the state was changed.
   */
  hideCursor() {
    if (!isCursorVisible) {
      return false;
    }

    this.nativeWrite("\x1B[?25l");
    isCursorVisible = false;
    return true;
  },

  /**
   * Calls controlled charm command.
   *
   * @param charmCommand
   * @param args
   *  Arguments to send to the command.
   */
  charm(charmCommand, ...args) {
    this.charming = true;
    charm[charmCommand].call(charm, ...args);
    this.charming = false;
    return this;
  },

  ///////////////////////////
  // TEXT METHODS
  ///////////////////////////

  /**
   * Ensures given amount of empty lines at the end.
   *
   * @param lines
   */
  ensureEmptyLines(lines) {
    this.nativeWrite("\n".repeat(lines + 1));
    this.charm("up", lines + 1);
    this.charm("column", cursor.x + 1);
  },

  /**
   * Writes un-controlled output.
   *
   * @param buff
   * @param encoding
   * @param callback
   * @param type
   */
  nativeWrite(buff, encoding, callback, type = "out") {
    nativeWrite[type](buff, encoding, callback);
  },

  /**
   * Write controlled output.
   *
   * This function replaces the core stdout/err.write and parses the to be
   * written output in a way that cursor position is in any moment known.
   *
   * @param buff
   * @param encoding
   * @param callback
   * @param type
   * @returns {*}
   */
  parsedWrite(buff, encoding, callback, type) {
    // When calling charm we can skip costly parsing. This is known
    // internally and prevents counting of ANSI sequences.
    if (this.charming) {
      return this.nativeWrite(buff, encoding, callback, type);
    }

    // To easily manipulate the data we convert it to string.
    if (Array.isArray(buff)) {
      buff = String.fromCharCode.apply(buff);
    }
    else if (Buffer.isBuffer(buff)) {
      buff = buff.toString();
    }

    // Make sure we have a string from now on.
    if (typeof buff !== "string") {
      return;
    }

    // Stores the difference in position that the output will generate.
    let positionDiff = 0;

    // Allow for the use of ANSI cursor move sequences. These need to
    // be handled accurately to keep real position of cursor.
    let ansiMoves = buff.match(ANSI_MOVE_REGEX);
    if (ansiMoves) {
      let num = parseInt(ansiMoves[1]) || 0;
      let column = totalChars % this.width();

      switch(ansiMoves[2]) {
        case "A": positionDiff -= this.width() * num; break;
        case "B": positionDiff += this.width() * num; break;
        case "C": positionDiff += Math.min(column, num); break;
        case "D": positionDiff -= Math.min(column, num); break;
        case "G": positionDiff -= column - num; break;
      }
    }

    // Detect and register cursor visibility state.
    let ansiCursor = buff.match(ANSI_VISIBLITY_REGEX);
    if (ansiCursor) {
      switch(ansiCursor[1]) {
        case "h": isCursorVisible = true; break;
        case "l": isCursorVisible = false; break;
      }
    }

    // From here on we don't want any ANSI sequences as we have visible
    // characters in them. Separate new lines as we need to count how
    // many positions they take up.
    let rows = stripAnsi(buff).split("\n");
    for (let i = 0; i < rows.length; ++i) {
      let visibleMatch = (rows[i].match(VISIBLE_REGEX_G) || []);

      // There can be many match sequences, so count all of them.
      for (let j = 0; j < visibleMatch.length; ++j) {
        positionDiff += visibleMatch[j].length;
      }

      if (i !== rows.length - 1) {
        // For each non-last row we have a new line character and
        // have to calculate how many spaces are until the end.
        let w = this.width();
        positionDiff += w - (totalChars + positionDiff) % w;
      }
    }

    if (positionDiff) {
      this.notify("before_write");
    }

    this.nativeWrite(buff, encoding, callback, type);

    // Even if we got until this point the cursor might be in the same
    // location so prevent registering and positioning.
    if (positionDiff) {
      totalChars += positionDiff;
      cursor.y = Math.floor(totalChars / this.width());

      this.notify("after_write");
      this.updateCursorPosition();
    }
  },


  /**
   * Register event listener.
   *
   * @param event
   * @param callback
   */
  on(event, callback) {
    if (!events[event]) {
      events[event] = [callback];
    } else {
      events[event].push(callback);
    }
  },

  /**
   * Un-register event listener.
   *
   * @param event
   * @param callback
   * @returns {boolean}
   *  Whether the event was removed.
   */
  stopOn(event, callback) {
    if (events[event]) {
      let i = events[event].indexOf(callback);
      if (i !== -1) {
        events[event].splice(i, 1);
        return true;
      }
    }
    return false;
  },

  /**
   * Fires event listeners.
   *
   * @param event
   * @param args
   *  Arguments to pass to event.
   */
  notify(event, ...args) {
    if (events[event]) {
      for (let i = 0; i < events[event].length; i++) {
        events[event][i](...args);
      }
    }
  }
};

module.exports = function() {
  if (!JSTermInitialized) {
    // Setup charm and stdin.
    charm.pipe(process.stdout);
    process.stdin.setEncoding("utf8");

    const func = function (buff, encoding, callback) {
      SmartTerminal.parsedWrite(buff, encoding, callback, this.type);
    };
    // Replace original write method so we can have more control.
    process.stdout.write = func.bind({type: "out"});
    process.stderr.write = func.bind({type: "err"});

    // Pipe exit event.
    process.on("exit", function() {
      SmartTerminal.notify("exit");
    });
    process.on("SIGINT", process.exit);

    JSTermInitialized = true;
  }

  return SmartTerminal;
};