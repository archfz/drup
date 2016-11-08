//var exec = require("child_process").exec;
//var colors = require("colors");

var operations = {};
require("fs").readdirSync(__dirname+"/operations").forEach(function(file) {
    operations[file.split('.')[0]] = require("./operations/" + file);
});

var guide = require("./guide")(operations);

module.exports = (operation, arguments) => {

    if(!operation || operation == "help") {
        guide.showHelp();
        return 1;
    }

    if (!operations[operation]) {
        guide.alertUnrecognizedOperation(operation);
        return 0;
    }

    operations[operation].run.apply(arguments);
};