"use strict";

const WebService = require("../web_base");

/**
 * @id apache
 * @group web
 * @label Apache
 * @priority 5
 */
module.exports = class ApacheService extends WebService {

  _composeDocker() {
    let compose = {
      image: "httpd:alpine",
    };

    return compose;
  }

};