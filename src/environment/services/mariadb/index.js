"use strict";

const MysqlService = require("../mysql");
const inquirer = require("inquirer");

/**
 * @id mariadb
 * @group database
 * @label MariaDB
 * @priority 20
 */
module.exports = class MariadbService extends MysqlService {

  _composeDocker() {
    let compose = super._composeDocker();
    compose.image = "mariadb:latest";

    return compose;
  }

};