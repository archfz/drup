"use strict";

const Service = require("../service_base");

class MariadbService extends Service {

  defaults() {
    return {
      image: "wodby/drupal-mariadb:1.0.0",
      environment: {
        MYSQL_RANDOM_ROOT_PASSWORD: 1,
        MYSQL_DATABASE: "drupal",
        MYSQL_USER: "admin",
        MYSQL_PASSWORD: "drupal",
      }
    }
  }

  compose() {
    return this.config;
  }

  static getKey() {
    return "mariadb";
  }

  static getType() {
    return "database";
  }

}