"use strict";

const yaml = require("js-yaml");
const fs = require("fs-promise");

/**
 * Simple wrapper for fs-yaml to function with promises.
 */
module.exports = {

    /**
     * Read yaml data from file.
     *
     * @param {string} path
     *      The path to the yaml file.
     *
     * @returns {Promise.<Object>}
     */
    read(path) {
        return fs.readFile(path).then((data) => yaml.safeLoad(data));
    },

    /**
     * Writes yaml data to given file.
     *
     * @param {string} path
     *      The path to the yaml file.
     * @param {Object} data
     *      The data to write.
     *
     * @returns {Object}
     */
    write(path, data) {
        return fs.writeFile(path, yaml.safeDump(data));
    },

};
