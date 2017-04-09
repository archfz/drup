"use strict";

const Service = require("../../service_base");

/**
 * @id pma
 * @group misc
 * @label PHPMyAdmin
 * @aliased
 */
module.exports = class PhpMyAdminService extends Service {

  /**
   * @inheritdoc
   */
  _composeDocker() {
    let compose = {
      image: "phpmyadmin/phpmyadmin:latest",
      environment: {
        PMA_HOST: Object.keys(this.env.services.ofGroup("database"))[0]
      }
    };

    return compose;
  }

};