"use strict";

const Service = require("../service_base");

/**
 * @id lighttpd
 * @group web
 * @label LightTPD
 */
module.exports = class LightTpdService extends Service {

  compose_docker() {
    let compose = {
      image: "sebp/lighttpd",
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