"use strict";

const Service = require("../service");

class NginxService extends Service {

  defaults() {
    return {
      NGINX_SERVER_NAME: "localhost",
      NGINX_UPSTREAM_NAME: "php",
      DRUPAL_VERSION: 8,
    }
  }

  compose(container) {
    return {
      image: "wodby/drupal-nginx:1.10-1.1.0",
      environment: this.config,
      volumes_from: [container.service("php").getKey()],
      ports: ["8000:80"],
    }
  }

  static getKey() {
    return "nginx";
  }

  static getType() {
    return "web-server";
  }

}

exports = NginxService;