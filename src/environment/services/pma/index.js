"use strict";

const Service = require("../../service_base");

/**
 * @Service {
 *  @id "pma",
 *  @group "misc",
 *  @label "PHPMyAdmin",
 *  @aliased true,
 * }
 */
module.exports = class PhpMyAdminService extends Service {

  /**
   * @inheritdoc
   */
  _composeDocker() {
    let compose = {
      build:  {
        BASE_IMAGE: "phpmyadmin/phpmyadmin:latest"
      },
      environment: {
        PMA_HOST: Object.keys(this.env.services.ofGroup("database"))[0]
      }
    };

    return compose;
  }

};