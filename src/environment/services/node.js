"use strict";

const Service = require("../service_base");
const inquirer = require("inquirer");

const images = {
  "7.5" : "node:7.5-alpine",
  "6.9" : "node:6.9-alpine",
  "4.7" : "node:4.7-alpine",
};

class PhpService extends Service {

  configure() {
    let choices = [];
    for (const [key] of Object.entries(images)) {
      choices.push({
        name: key,
        checked: key == this.config.version,
      });
    }

    return inquirer.prompt({
      type: "list",
      name: "version",
      message: "Node version:",
      choices: choices,
    }).then((values) => {
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
      version: "7.5",
    };
  }

  static getKey() {
    return "php";
  }

  static getType() {
    return "php";
  }

  static getLabel() {
    return "PHP service";
  }

}

module.exports = PhpService;