"use strict";

const Service = require("../service_base");

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

  static getKey() {
    return "nginx";
  }

  static getType() {
    return "web";
  }

  static getLabel() {
    return "NGINX";
  }

}

module.exports = NginxService;