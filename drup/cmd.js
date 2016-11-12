var prompt = require("inquirer");
var colors = require("colors");

module.exports = {
    error : function(msg) {
        console.log("!! Error: ".red + msg);
    },

    warning : function(msg) {
        console.log("! Warning: ".yellow + msg);
    },

    info : function(msg) {
        console.log("├╼ ".blue + msg);
    },

    heading : function(msg) {
        console.log('\n┌ '.blue + msg.toUpperCase().green + ' ┐'.blue)

        var line = "├─────────────────────────────────────────────────";
        console.log((line.substr(0, msg.length+3)+'┘').blue)
    }
};