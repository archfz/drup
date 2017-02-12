"use strict";

const Service = require("../service_base");
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
      this.config.xdebug = values.xdebug;
    });
  }

  compose_docker() {
    let compose = {
      image: PhpService.imageDir(),
      environment: {
        PHP_VERSION: this.config.version,
        PHP_XDEBUG: this.config.xdebug,
        PHP_EXTENSIONS: this.config.additional_extensions.join(" "),
      }
    };

    return compose;
  }

  static defaults() {
    return {
      version: "7.1",
      xdebug: 1,
      additional_extensions: ["opcache"],
    };
  }

};