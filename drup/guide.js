var cmd = require("./cmd");

module.exports = function(operations){
    return {
        alertUnrecognizedOperation(operation) {
            cmd.error("Unrecognized operation: " + operation);
            this.showAvailableOperations(operations);
        },

        showAvailableOperations() {
            cmd.heading("Available operations");
            for (var op in operations) {
                cmd.info(op+" : " + operations[op].description);
            }
        },

        showHelp() {
            this.showAvailableOperations();
        }
    };
};