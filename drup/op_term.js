'use strict';

const charm = require("charm")();
const stripAnsi = require("strip-ansi");

function toUnicode(theString) {
    var unicodeString = '';
    for (var i=0; i < theString.length; i++) {
        var theUnicode = theString.charCodeAt(i).toString(16).toUpperCase();
        while (theUnicode.length < 4) {
            theUnicode = '0' + theUnicode;
        }
        theUnicode = '\\u' + theUnicode;
        unicodeString += theUnicode;
    }
    return unicodeString;
}

const _OPTerm = function() {
    const CURSOR_BLINK_RATE = 850,
        VISIBLE_REGEX = /^[\u0020-\u007e\u00a0-\u00ff]$/,
        VISIBLE_REGEX_G = /[\u0020-\u007e\u00a0-\u00ff]/g,
        nativeWrite = process.stdout.write.bind(process.stdout);

    let cursor = { x: 0, y: 0, n: 0, },

        totalChars = 0,
        inputIndex = 0,
        input = "",

        cleanLines = 2;

    class OPTerm {

        constructor() {
            charm.pipe(process.stdout);

            process.stdin.setRawMode(true);
            process.stdin.setEncoding('utf8');
            process.stdin.resume();

            //nativeWrite("\x1B[?25l");

            process.stdout.write = this.parsedWrite.bind(this);

            process.stdin.on('data', this.writeKey.bind(this));
            setInterval(this.unRenderCursor.bind(this), CURSOR_BLINK_RATE);
        }

        static get width() {
            return process.stdout.columns;
        }

        static get height() {
            return process.stdout.rows;
        }

        ///////////////////////////
        // CURSOR METHODS
        ///////////////////////////

        setCursorPosition(n) {
            n = (typeof n != "undefined" ? n : (totalChars + inputIndex));

            let y = Math.floor(n / OPTerm.width),
                x = n % OPTerm.width;

            if (cursor.y != y){
                if (cursor.y > y)
                    charm.up(cursor.y - y);
                else if (cursor.y < y)
                    charm.down(y - cursor.y);
            }

            charm.column(x + 1);

            cursor = {x:x, y:y, n:n};
        }

        cursorLeft(n) {
            n = n || 1;

            inputIndex = Math.max(0, inputIndex - n);
            this.setCursorPosition();
        }
        cursorUp(n) {
            n = n || 1;
            this.cursorLeft(OPTerm.width * n);
        }
        cursorRight(n) {
            n = n || 1;

            inputIndex = Math.min(input.length, inputIndex + n);
            this.setCursorPosition();
        }
        cursorDown(n) {
            this.cursorRight(OPTerm.width * (n || 1));
        }

        ///////////////////////////
        // TEXT METHODS
        ///////////////////////////

        clearLines(x) {
            charm.column(OPTerm.width);
            nativeWrite("  ");

            nativeWrite(" ".repeat(cleanLines * OPTerm.width));

            charm.up(cleanLines + 1);
            charm.column(cursor.x + 1);
        }

        renderText(text, noCursor) {
            nativeWrite(text + " ");
            cursor.y = Math.floor((totalChars + text.length) / OPTerm.width);

            this.clearLines();
            noCursor || this.renderCursor();
        }

        renderInput() {
            this.setCursorPosition(totalChars);
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
        }

        parsedWrite(buff, encoding, callback) {

            if (Array.isArray(buff))
                buff = String.fromCharCode.apply(buff);
            else if (Buffer.isBuffer(buff))
                buff = buff.toString();

            if (typeof buff !== 'string')
                return;

            let rows = stripAnsi(buff).split('\n'),
                visibleLength = 0;

            for (let i = 0; i < rows.length; ++i) {
                visibleLength += (rows[i].match(VISIBLE_REGEX_G) || []).length;

                if (i != rows.length - 1)
                    visibleLength += OPTerm.width - (totalChars + visibleLength) % OPTerm.width;
            }

            nativeWrite(buff, encoding, callback);

            if (visibleLength) {
                totalChars += visibleLength;
                cursor.y = Math.floor(totalChars / OPTerm.width);
                this.clearLines();
            }
        }

        removeChar(n) {
            n = n || 1;

            if (inputIndex < n)
                return false;

            if(input.length == inputIndex)
                input = input.slice(0, -1);
            else if(inputIndex == 1)
                input = input.slice(1);
            else input = input.slice(0, inputIndex - 1) +
                    input.slice(inputIndex);

            this.setCursorPosition(cursor.n - n + 1);
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
        }

        writeKey (ch, key) {
            if (ch == '\u0003') {
                nativeWrite("\x1B[?25h");
                this.clearLines();

                process.exit(0);
            }

            if (!ch)
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

            /*if (ch == '\r') {
                this.enter();
            } else if (ch.charCodeAt(0) === 127) {
                this.removeChar(1);
            } else if (ch.match(VISIBLE_REGEX)) {
                this.insert(ch);
            }*/
        }

        renderCursor() {
            this.setCursorPosition();
            if (inputIndex < input.length)
                nativeWrite(input[inputIndex].bgYellow);
            else
                nativeWrite(" ".bgYellow);
            this.setCursorPosition();
        }

        unRenderCursor() {
            this.setCursorPosition();
            if (inputIndex < input.length)
                nativeWrite(input[inputIndex]);
            else
                nativeWrite(" ");

            setTimeout(this.renderCursor.bind(this), CURSOR_BLINK_RATE / 2);
        }
    }

    return OPTerm;
};

module.exports = function() {
    return new (_OPTerm());
};