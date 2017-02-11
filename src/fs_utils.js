"use strict";

const fs = require("fs-extra");

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

};
