"use strict";

const Service = require("../service_base");

/**
 * @id nginx
 * @group web
 * @label NGINX
 */
class NginxService extends Service {

  compose_docker() {
    let compose = {
      image: "nginx:stable-alpine",
    };

    return compose;
  }

  static defaults() {
    return {

    };
  }

}

module.exports = NginxService;