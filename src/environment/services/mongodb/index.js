"use strict";

const Service = require("../../service_base");
const inquirer = require("inquirer");

/**
 * @id mongodb
 * @group database
 * @label MongoDB
 * @priority 10
 */
module.exports = class MongodbService extends Service {

  _configure() {
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
        MONGODB_DATABASE: env.env_name,
        MONGODB_USER: this.config.user,
        MONGODB_PASSWORD: this.config.password,
      },
      volumes: [`./data/${this.ann("id")}:/bitnami/mongodb`]
    };

    return compose;
  }

  static defaults() {
    return {
      user: "admin",
      password: "admin",
    };
  }

};