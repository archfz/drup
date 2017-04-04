"use strict";

const fs = require("fs-promise");

module.exports = {

  copy(source, destintation) {
    fs.copySync(source, destintation);
  },

  ensureDirectory(dir) {
    if (!fs.existsSync(dir)){
      fs.mkdirSync(dir);
    }
  },

  setDirectory(dir, create = false) {
    create && this.ensureDirectory(dir);
    process.chdir(dir);
  },

  isFile(filePath) {
    try {
      fs.readFileSync(filePath, "utf8");
      return true;
    }
    catch (err) {
      return false;
    }
  },

  /**
   * Generates from base an empty directory path.
   *
   * @param {string} basePath
   *    The base path to start from.
   *
   * @return {Promise.<string>}
   *    The empty suggested path.
   */
  suggestEmptyDirectory(basePath) {
    let generatePath = (at = "") => {
      return fs.readdir(basePath + at)
        // If the directory exists it still can be good if it doesn't
        // contain any files.
        .then((files) => files.length === 0)
        // If there is an error than either it doesn't exist or it
        // is a file.
        .catch(() => !this.isFile(basePath + at))
        .then((empty) => {
          if (empty) {
            return basePath + at;
          }

          return generatePath(at === "" ? 1 : at + 1);
        });
    };

    return generatePath();
  },

};
