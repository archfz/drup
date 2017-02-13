"use strict";

const Service = require("../../service_base");

/**
 * @id apache
 * @group web
 * @label Apache
 * @priority 5
 */
module.exports = class ApacheService extends Service {

  compose_docker() {
    let compose = {
      image: "httpd:alpine",
      volumes_from: [this.config.upstream_name],
    };

    return compose;
  }

  static defaults() {
    return {
      upstream_name: "php",
    };
  }

};