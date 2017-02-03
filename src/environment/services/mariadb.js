"use strict";

const MysqlService = require("./mysql");
const inquirer = require("inquirer");

/**
 * @id mariadb
 * @group database
 * @label MariaDB
 * @priority 20
 */
module.exports = class MariadbService extends MysqlService {

  compose_docker(services, env) {
    let compose = super.compose_docker(services, env);
    compose.image = "mariadb:latest";

    return compose;
  }

};