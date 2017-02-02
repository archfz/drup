"use strict";

const Service = require("../service_base");

class LightTpdService extends Service {

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

  static getKey() {
    return "lighttpd";
  }

  static getType() {
    return "web";
  }

  static getLabel() {
    return "LightTPD";
  }

}

module.exports = LightTpdService;