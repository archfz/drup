"use strict";

const os = require("os");

exports.GLOBAL_STORE_ROOT = os.homedir() + "/.drup/";
exports.TEMPORARY_DIR = exports.GLOBAL_STORE_ROOT + "tmp/";
exports.PROJECTS_DIR = os.homedir() + "/Documents/drup-projects/";

exports.ENV_CONFIG_FILENAME = ".drup-env.yml";

module.exports = exports;
