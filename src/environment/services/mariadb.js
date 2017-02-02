"use strict";

const MysqlService = require("./mysql");
const inquirer = require("inquirer");

class MariadbService extends MysqlService {

  compose_docker(env) {
    let compose = super.compose_docker(env);
    compose.image = "mariadb:latest";

    return compose;
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