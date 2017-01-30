"use strict";

const fs = require("fs");

module.exports = {

  ensureDirectory(dir) {
    if (!fs.existsSync(dir)){
      fs.mkdirSync(dir);
    }
  },

  setDirectory(dir, create = false) {
    create && this.ensureDirectory(dir);
    process.chdir(dir);
  }

};
