"use strict";

const Service = require("../service_base");
const inquirer = require("inquirer");

class MariadbService extends Service {

  configure() {
    return inquirer.prompt([{
      type: "input",
      name: "user",
      message: "MySQL user:",
      default: this.config.user,
    }, {
      type: "input",
      name: "password",
      message: "MySQL password:",
      default: this.config.password,
    }]).then((values) => {
      this.config.user = values.user;
      this.config.password = values.password;
    });
  }

  compose_docker() {
    let compose = {
      image: "wodby/drupal-mariadb:1.0.0",
      environment: {
        MYSQL_RANDOM_ROOT_PASSWORD: 1,
        MYSQL_DATABASE: "drupal",
        MYSQL_USER: this.config.user,
        MYSQL_PASSWORD: this.config.password,
      }
    };

    return compose;
  }

  static defaults() {
    return {
      user: "admin",
      password: "admin",
    };
  }

  static getKey() {
    return "mariadb";
  }

  static getType() {
    return "database";
  }

  static getLabel() {
    return "MariaDB";
  }

}

module.exports = MariadbService;