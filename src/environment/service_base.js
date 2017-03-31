"use strict";

const utils = require("../utils");
const path = require("path");
const fs = require("fs-promise");

const Template = require("../template");

class ServiceBase {

  constructor(config) {
    this.config = config || this.constructor.getDefaultConfig();
    this._config_extensions = {};
  }

  static getDefaultConfig() {
    let config = {};

    for (let [key, def] of Object.entries(this.defineConfiguration())) {
      config[key] = def.default;
    }

    return config;
  }

  static defineConfiguration() {
    return {};
  }

  get env() {
    if (!this._env) {
      throw new Error("Service not bound to any environment.");
    }

    return this._env;
  }

  getOperations() {
    return [];
  }

  getDomainAlias() {
    if (!this.ann("aliased")) {
      return false;
    }

    return this.env.config.host_alias + "." + this.ann("id");
  }

  runOperation(name, args) {
    throw new Error(`Service '${this.ann("id")}' does not provide '${name}' operation.`);
  }

  printInformation() {
    if (!Object.keys(this.config).length) {
      return;
    }

    console.log(`-- ${this.ann('label')} info`);

    if (this.ann("aliased")) {
      console.log("Reachable on: " + this.getDomainAlias());
    }

    console.log("- CONTAINER HOSTS ALIAS: \"" + this.ann("id") + "\"");

    for (let [key, def] of Object.entries(this.constructor.defineConfiguration())) {
      console.log(`- ${def.label} : ${JSON.stringify(this.config[key], null, "\t")}`);
    }
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

  registerConfigExtension({template, data}) {
    const filename = path.basename(template);
    if (!this._config_extensions[filename]) {
      this._config_extensions[filename] = [];
    }

    this._config_extensions[filename].push({template, data});
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
