"use strict";

const Service = require("../service_base");

class PhpMyAdminService extends Service {

  compose_docker(env) {
    let compose = {
      image: "phpmyadmin/phpmyadmin:latest"
    };

    return compose;
  }

  static getKey() {
    return "pma";
  }

  static getType() {
    return "misc";
  }

  static getLabel() {
    return "PhpMyAdmin";
  }

}

module.exports = PhpMyAdminService;