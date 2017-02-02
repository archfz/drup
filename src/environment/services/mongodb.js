"use strict";

const Service = require("../service_base");
const inquirer = require("inquirer");

class MongodbService extends Service {

  configure() {
    return inquirer.prompt([{
      type: "input",
      name: "user",
      message: "MongoDB user:",
      default: this.config.user,
    }, {
      type: "password",
      name: "password",
      message: "MongoDB password:",
      default: this.config.password,
    }]).then((values) => {
      this.config.user = values.user;
      this.config.password = values.password;
    });
  }

  compose_docker(env) {
    let compose = {
      image: "bitnami/mongodb:latest",
      environment: {
        MONGODB_DATABASE: env.projectName,
        MONGODB_USER: this.config.user,
        MONGODB_PASSWORD: this.config.password,
      },
      volumes: [`./data/${this.getKey()}:/bitnami/mongodb`]
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

module.exports = MongodbService;