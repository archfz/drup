"use strict";

const Service = require("../service_base");
const inquirer = require("inquirer");

const images = {
  "7.0" : "wodby/drupal-php:7.0-1.0.0",
  "5.6" : "wodby/drupal-php:5.6-1.0.0",
};

class PhpService extends Service {

  configure() {
    return inquirer.prompt({
      type: 'list',
      name: 'image',
      message: 'PHP version:',
      choices: [{
        name: "7.0",
        checked: this.config.version == "7.0",
      }, {
        name: "5.6",
        checked: this.config.version == "5.6",
      }],
    }).then((values) => {
      this.config.image = values.image;
    });
  }

  compose_docker() {
    let compose = {
      image: images[this.config.version],
      environment: {
        HOST_NAME: this.config.host_name,
        XDEBUG_ENABLED: this.config.xdebug_enabled,
      },
      volumes: ["./drupal/:/var/www/html"],
    };

    return compose;
  }

  static defaults() {
    return {
      version: "7.0",
      host_name: "localhost:8000",
      xdebug_enabled: 1,
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