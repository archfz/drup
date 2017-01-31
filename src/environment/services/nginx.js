"use strict";

const Service = require("../service_base");

class NginxService extends Service {

  compose_docker() {
    let compose = {
      image: "wodby/drupal-nginx:1.10-1.1.0",
      environment: {
        NGINX_SERVER_NAME: this.config.server_name,
        NGINX_UPSTREAM_NAME: this.config.upstream_name,
      },
      volumes_from: [this.config.upstream_name],
      ports: ["8000:80"],
    };

    return compose;
  }

  static defaults() {
    return {
      server_name: "localhost",
      upstream_name: "php",
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