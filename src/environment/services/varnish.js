"use strict";

const Service = require("../service_base");

/**
 * @id varnish
 * @group cache
 * @label Varnish
 */
class VarnishService extends Service {

  compose_docker(env) {
    let compose = {
      image: "wodby/varnish-alpine"
    };

    return compose;
  }

}

module.exports = VarnishService;