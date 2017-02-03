"use strict";

const Service = require("../service_base");
const inquirer = require("inquirer");

/**
 * @id mysql
 * @group database
 * @label MySQL
 */
module.exports = class MysqlService extends Service {

  _configure() {
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

  compose_docker(services, env) {
    let compose = {
      image: "mysql/mysql-server:5.7",
      environment: {
        MYSQL_RANDOM_ROOT_PASSWORD: 1,
        MYSQL_DATABASE: env.projectName,
        MYSQL_USER: this.config.user,
        MYSQL_PASSWORD: this.config.password,
      },
      volumes: [`./data/${this.ann("id")}:/var/lib/mysql`]
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