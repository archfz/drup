"use strict";

const Service = require("../service");
const inquirer = require("inquirer");

class PhpService extends Service {

  configure() {
    inquirer.prompt({
      type: 'list',
      name: 'image',
      default: "7.0",
      message: 'PHP version:',
      choices: [{
        name: "7.0",
        value: "wodby/drupal-php:7.0-1.0.0",
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
    compose.volumes = "./drupal/:/var/www/html";

    return compose;
  }

  static getKey() {
    return "php";
  }

  static getType() {
    return "php";
  }

}

exports = PhpService;