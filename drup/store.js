var process = require("process");
var Storage = require("node-storage");

var STORE_ROOT = process.env['HOME'] + "/.config/drup/";
var STORE = {
    ENVIRONMENTS : STORE_ROOT + "environments.store",
};

function Store() {

}

Store.prototype = {

};

module.exports = Store;
