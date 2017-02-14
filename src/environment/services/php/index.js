"use strict";

const Service = require("../../service_base");
const inquirer = require("inquirer");

const versions = ["7.1", "7.0" , "5.6" ];

/**
 * @id php
 * @group engine
 * @label PHP
 */
module.exports = class PhpService extends Service {

  _configure() {
    let choices = [];
    versions.forEach((version) => {
      choices.push({
        name: version,
        checked: version == this.config.version,
      });
    });

    return inquirer.prompt([{
      type: "list",
      name: "version",
      message: "PHP version:",
      choices: choices,
    }, {
      type: "confirm",
      name: "xdebug",
      message: "Enabled xDebug?",
      default: true,
    }]).then((values) => {
      this.config.version = values.version;
      this.config.xdebug = values.xdebug ? 1 : 0;
    });
  }

  _composeDocker() {
    let compose = {
      build: {
        PHP_VERSION: this.config.version,
        PHP_XDEBUG: this.config.xdebug,
        PHP_EXTENSIONS: this.config.additional_extensions,
      },
    };

    return compose;
  }

  addExtensions(extension) {
    if (typeof extension === "string") {
      extension = [extension];
    }

    this.config.additional_extensions = this.config.additional_extensions
      .concat(extension).filter((ext, i, arr) => arr.indexOf(ext) == i);
  }

  static defaults() {
    return {
      version: "7.1",
      xdebug: 1,
      additional_extensions: ["opcache"],
    };
  }

};