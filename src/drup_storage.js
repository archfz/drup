"use strict";

const Storage = require("node-storage");
const os = require('os');

const GLOBAL_STORE_ROOT = os.homedir() + "/.drup/";
const GLOBAL_STORE = {
  config : { path: "config.json" },
  projects : { path: "projects.json" },
};

let openStorages = {};

class DrupStorage {

  constructor(file) {
    this.driver = new Storage(file);
  }

  set(key, value) {
    this.driver.put(key, value);
  }

  get(key) {
    return this.driver.get(key);
  }

  remove(key) {
    this.driver.remove(key);
  }

}

module.exports = {

  get config() {
    return this.get(GLOBAL_STORE_ROOT + GLOBAL_STORE.config.path);
  },

  get projects() {
    return this.get(GLOBAL_STORE_ROOT + GLOBAL_STORE.projects.path);
  },

  get(file) {
    if (!openStorages[file]) {
      openStorages[file] = new DrupStorage(file);
    }

    return openStorages[file];
  }

};