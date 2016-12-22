"use strict";

const charm = require("charm")();
const encode = require("charm/lib/encode");
const stripAnsi = require("strip-ansi");

// function toUnicode(theString) {
//     var unicodeString = '';
//     for (var i=0; i < theString.length; i++) {
//         var theUnicode = theString.charCodeAt(i).toString(16).toUpperCase();
//         while (theUnicode.length < 4) {
//             theUnicode = '0' + theUnicode;
//         }
//         theUnicode = '\\u' + theUnicode;
//         unicodeString += theUnicode;
//     }
//     return unicodeString;
// }

// Visible characters that move the cursor.
const VISIBLE_REGEX_G = /[\u0020-\u007e\u00a0-\u00ff]/gi;
// ANSI escape sequences that move the cursor.
const ANSI_MOVE_REGEX = /[\u001b\u009b][\[]([0-9]+)([ABCDG])/;
// ANSI escape sequences that set the cursor visibility.
const ANSI_VISIBLITY_REGEX = /[\u001b\u009b]\[\?25([hl])/;

let JSTermInitialized = false;

let nativeWrite = process.stdout.write.bind(process.stdout);

let cursor = { x: 0, y: 0, n: 0 };
let isCursorVisible = true;

let totalChars = 0;
let inputIndex = 0;
let input = "";

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
        n = (typeof n != "undefined" ? n : (totalChars + inputIndex));

        let y = Math.floor(n / this.width());
        let x = n % this.width();

        if (cursor.y != y){
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
        if (direction == "bottom") {
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

    /*cursorLeft(n) {
     n = n || 1;

     inputIndex = Math.max(0, inputIndex - n);
     this.updateCursorPosition();
     }
     cursorUp(n) {
     n = n || 1;
     this.cursorLeft(SmartTerminal.width * n);
     }
     cursorRight(n) {
     n = n || 1;

     inputIndex = Math.min(input.length, inputIndex + n);
     this.updateCursorPosition();
     }
     cursorDown(n) {
     this.cursorRight(SmartTerminal.width * (n || 1));
     }*/

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

    /*renderText(text, noCursor) {
     this.nativeWrite(text + " ");
     cursor.y = Math.floor((totalChars + text.length) / SmartTerminal.width);

     this.ensureEmptyLines();
     noCursor || this.renderCursor();
     }

     renderInput() {
     this.updateCursorPosition(totalChars);
     this.renderText(input);
     }

     insert(char) {
     if (inputIndex == input.length) {
     input += char;
     } else {
     input = input.slice(0, inputIndex) + char +
     input.slice(inputIndex);
     }

     ++inputIndex;
     this.renderInput();
     }*/

    /**
     * Writes un-controlled output.
     *
     * @param buff
     * @param encoding
     * @param callback
     */
    nativeWrite(buff, encoding, callback) {
        nativeWrite(buff, encoding, callback);
    },

    /**
     * Write controlled output.
     *
     * This function replaces the core stdout.write and parses the to be
     * written output in a way that cursor position is in any moment known.
     *
     * @param buff
     * @param encoding
     * @param callback
     * @returns {*}
     */
    parsedWrite(buff, encoding, callback) {
        // When calling charm we can skip costly parsing. This is known
        // internally and prevents counting of ANSI sequences.
        if (this.charming)
            return this.nativeWrite(buff, encoding, callback);

        // To easily manipulate the data we convert it to string.
        if (Array.isArray(buff))
            buff = String.fromCharCode.apply(buff);
        else if (Buffer.isBuffer(buff))
            buff = buff.toString();

        // Make sure we have a string from now on.
        if (typeof buff !== "string")
            return;

        // Stores the difference in position that the output will generate.
        let positionDiff = 0;

        // Allow for the use of ANSI cursor move sequences. These need to
        // be handled accurately to keep real position of cursor.
        let ansiMoves = buff.match(ANSI_MOVE_REGEX);
        if (ansiMoves) {
            let num = parseInt(ansiMoves[1]) || 0,
                column = totalChars % this.width();

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

            if (i != rows.length - 1) {
                // For each non-last row we have a new line character and
                // have to calculate how many spaces are until the end.
                let w = this.width();
                positionDiff += w - (totalChars + positionDiff) % w;
            }
        }

        if (positionDiff) {
            this.notify("before_write");
        }

        this.nativeWrite(buff, encoding, callback);

        // Even if we got until this point the cursor might be in the same
        // location so prevent registering and positioning.
        if (positionDiff) {
            totalChars += positionDiff;
            cursor.y = Math.floor(totalChars / this.width());

            this.notify("after_write");
            this.updateCursorPosition();
        }
    },

    /*removeChar(n) {
     n = n || 1;

     if (inputIndex < n)
     return false;

     if(input.length == inputIndex)
     input = input.slice(0, -1);
     else if(inputIndex == 1)
     input = input.slice(1);
     else input = input.slice(0, inputIndex - 1) +
     input.slice(inputIndex);

     this.updateCursorPosition(cursor.n - n + 1);
     nativeWrite(" ".repeat(n));

     --inputIndex;
     this.renderCursor();
     }

     enter() {
     let inputBuff = input;
     this.unRenderCursor();

     totalChars += input.length;
     input = "";
     inputIndex = 0;

     this.newLine();

     process.stdin.push(inputBuff);
     }

     newLine() {
     this.parsedWrite('\n');
     }*/

    parseInput (ch, key) {
        if (ch == "\u0003") {
            this.notify("exit");

            process.exit(0);
        }

        /*if (!ch)
         return;

         if (ch == '\u001B') {
         this.escaped = true;
         return;
         }

         if (this.escaped) {
         if (ch == '\u005B')
         return;

         if (ch == '\u0041') { // UP
         this.cursorUp();
         }else if (ch == '\u0044') { // LEFT
         this.cursorLeft();
         }else if (ch == '\u0042') { // DOWN
         this.cursorDown();
         }else if (ch == '\u0043') { // RIGHT
         this.cursorRight();
         }

         this.renderInput();

         this.escaped = false;
         return;
         }

         if (ch == '\r') {
         this.enter();
         } else if (ch.charCodeAt(0) === 127) {
         this.removeChar(1);
         } else if (ch.match(VISIBLE_REGEX)) {
         this.insert(ch);
         }*/
    },

    /*renderCursor() {
     this.updateCursorPosition();
     if (inputIndex < input.length)
     nativeWrite(input[inputIndex].bgYellow);
     else
     nativeWrite(" ".bgYellow);
     this.updateCursorPosition();
     }

     unRenderCursor() {
     this.updateCursorPosition();
     if (inputIndex < input.length)
     nativeWrite(input[inputIndex]);
     else
     nativeWrite(" ");

     setTimeout(this.renderCursor.bind(this), CURSOR_BLINK_RATE / 2);
     }*/

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
            if (i != -1) {
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

        // Replace original write method so we can have more control.
        process.stdout.write = SmartTerminal.parsedWrite.bind(SmartTerminal);
        // Listen to key-presses.
        process.stdin.on("data", SmartTerminal.parseInput.bind(SmartTerminal));
        //setInterval(this.unRenderCursor.bind(this), CURSOR_BLINK_RATE);

        // Pipe exit event.
        process.on("exit", function() {
            SmartTerminal.notify("exit");
        });
        process.on("SIGINT", process.exit);

        JSTermInitialized = true;
    }

    return SmartTerminal;
};