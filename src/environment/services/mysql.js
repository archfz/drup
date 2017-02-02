"use strict";

const Service = require("../service_base");
const inquirer = require("inquirer");

class MysqlService extends Service {

  configure() {
    return inquirer.prompt([{
      type: "input",
      name: "user",
      message: "MySQL user:",
      default: this.config.user,
    }, {
      type: "password",
      name: "password",
      message: "MySQL password:",
      default: this.config.password,
    }]).then((values) => {
      this.config.user = values.user;
      this.config.password = values.password;
    });
  }

  compose_docker(env) {
    let compose = {
      image: "mysql/mysql-server:5.7",
      environment: {
        MYSQL_RANDOM_ROOT_PASSWORD: 1,
        MYSQL_DATABASE: env.projectName,
        MYSQL_USER: this.config.user,
        MYSQL_PASSWORD: this.config.password,
      },
      volumes: [`./data/${this.getKey()}:/var/lib/mysql`]
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
    return "mysql";
  }

  static getType() {
    return "database";
  }

  static getLabel() {
    return "MySQL";
  }

}

module.exports = MysqlService;