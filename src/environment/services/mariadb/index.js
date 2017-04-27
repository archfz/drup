"use strict";

const MysqlService = require("../mysql");
const inquirer = require("inquirer");

/**
 * @Service {
 *  @id "mariadb",
 *  @group "database",
 *  @label "MariaDB",
 *  @priority 20,
 *  @aliased true,
 * }
 */
module.exports = class MariadbService extends MysqlService {

  /**
   * @inheritdoc
   */
  _composeDocker() {
    let compose = super._composeDocker();
    compose.image = "mariadb:latest";

    return compose;
  }

};