var prompt = require("prompt");
var colors = require("colors");

prompt.message = "> ".green;
prompt.delimiter = "";
prompt.start();


module.exports = {
    prompt : prompt,

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