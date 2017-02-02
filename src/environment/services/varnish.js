"use strict";

const Service = require("../service_base");

class VarnishService extends Service {

  compose_docker(env) {
    let compose = {
      image: "wodby/varnish-alpine"
    };

    return compose;
  }

  static getKey() {
    return "varnish";
  }

  static getType() {
    return "cache";
  }

  static getLabel() {
    return "Varnish";
  }

}

module.exports = VarnishService;