"use strict";

require("colors");

module.exports = {

    error(msg) {
        console.log("!! Error: ".red + msg);
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