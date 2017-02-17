"use strict";

const utils = require("../utils");
const path = require("path");
const fs = require("fs-promise");

const Template = require("../template");

class ServiceBase {

  constructor(config) {
    this.config = config || this.constructor.defaults();
    this._config_extensions = {};
  }

  static defaults() {
    return {};
  }

  get env() {
    if (!this._env) {
      throw new Error("Service not bound to any environment.");
    }

    return this._env;
  }

  bindEnvironment(env) {
    this._env = env;
  }

  configure() {
    if (!this._configure) {
      return Promise.resolve();
    }

    console.log("\n-- Configure " + this.ann("label"));
    return this._configure();
  }

  compose(containerType) {
    let fnName = "_compose" + containerType.charAt(0).toUpperCase() + containerType.slice(1);

    if (typeof this[fnName] !== "function") {
      utils.mustImplement(this, fnName);
    }

    return this[fnName]();
  }

  registerConfigExtension({ext, data}) {
    const filename = path.basename(ext);
    if (!this._config_extensions[filename]) {
      this._config_extensions[filename] = [];
    }

    this._config_extensions[filename].push(ext);
  }

  writeConfigFiles(root) {
    const configFiles = this._getConfigFileInfo();
    if (configFiles === null) {
      return Promise.resolve();
    }

    const configPath = path.join(__dirname, "services", this.ann("id"), "config");
    const destPath = path.join(root, this._dir("CONFIG"), this.ann("id"));

    let promises = [];
    configFiles.forEach((configInfo) => {
      if (typeof configInfo === "string") {
        promises.push(
          fs.copy(path.join(configPath, configInfo), destPath)
            .catch((err) => {
              throw new Error(`Failed copying configuration file '${configInfo}' to '${destPath}'\n${err}`);
            })
        );
      }
      else if (typeof configInfo === "object") {
        let {template, definitions, data} = configInfo;

        let temp = Template.from(path.join(configPath, template)).define(definitions);
        (this._config_extensions[template] || []).forEach((ext) => temp.extend(ext));

        promises.push(temp.compile(data, destPath));
      }
    });

    return Promise.all(promises);
  }

  _getConfigFileInfo() {
    return null;
  }

  _dir(type) {
    if (!this.env.constructor.DIRECTORIES.hasOwnProperty(type)) {
      throw new Error(`The environment doesn't define the '${type}' type of directory.`);
    }

    return this.env.constructor.DIRECTORIES[type];
  }

}

module.exports = ServiceBase;
