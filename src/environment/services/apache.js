"use strict";

const Service = require("../service_base");

class ApacheService extends Service {

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

  static getKey() {
    return "apache";
  }

  static getType() {
    return "web";
  }

  static getLabel() {
    return "Apache";
  }

}

module.exports = ApacheService;