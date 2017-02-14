"use strict";

const Service = require("../../service_base");

/**
 * @id lighttpd
 * @group web
 * @label LightTPD
 * @priority 10
 */
module.exports = class LightTpdService extends Service {

  _composeDocker() {
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