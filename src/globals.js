"use strict";

const os = require("os");

exports.GLOBAL_STORE_ROOT = os.homedir() + "/.drup/";
exports.TEMPORARY_DIR = exports.GLOBAL_STORE_ROOT + "tmp/";

if (os.platform() === "win32") {
  // On windows we want the project directory as close to partition root as
  // possible, due to the 260 character path limitation.
  exports.PROJECTS_DIR = os.homedir().split(':').shift() + ":/drup/";
}
else {
  exports.PROJECTS_DIR = os.homedir() + "/drup/";
}

module.exports = exports;
