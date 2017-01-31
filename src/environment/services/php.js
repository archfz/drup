"use strict";

const Service = require("../service_base");
const inquirer = require("inquirer");

class PhpService extends Service {

  configure() {
    return inquirer.prompt({
      type: 'list',
      name: 'image',
      message: 'PHP version:',
      choices: [{
        name: "7.0",
        value: "wodby/drupal-php:7.0-1.0.0",
        checked: true,
      }, {
        name: "5.6",
        value: "wodby/drupal-php:5.6-1.0.0",
      }],
    }).then((values) => {
      this.config.image = values.image;
    });
  }

  defaults() {
    return {
      image: "wodby/drupal-php:7.0-1.0.0",
      environment: {
        PHP_HOST_NAME: "localhost:8000",
        PHP_XDEBUG_ENABLED: 1,
      },
    }
  }

  compose() {
    let compose = {};
    Object.assign(compose, this.config);
    compose.volumes = ["./drupal/:/var/www/html"];

    return compose;
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