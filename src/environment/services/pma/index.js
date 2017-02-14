"use strict";

const Service = require("../../service_base");

/**
 * @id pma
 * @group misc
 * @label PHPMyAdmin
 */
module.exports = class PhpMyAdminService extends Service {

  _composeDocker() {
    let compose = {
      image: "phpmyadmin/phpmyadmin:latest"
    };

    return compose;
  }

};