"use strict";

const Service = require("../service_base");
const inquirer = require("inquirer");

const images = {
  "7.1" : "php:7.1-fpm-alpine",
  "7.0" : "php:7.0-fpm-alpine",
  "5.6" : "php:5.6-fpm-alpine",
};

/**
 * @id php
 * @group engine
 * @label PHP
 */
module.exports = class PhpService extends Service {

  configure() {
    let choices = [];
    for (const [key] of Object.entries(images)) {
      choices.push({
        name: key,
        checked: key == this.config.version,
      });
    }

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
      image: images[this.config.version],
    };

    return compose;
  }

  static defaults() {
    return {
      version: "7.1",
      xdebug: 1,
    };
  }

};