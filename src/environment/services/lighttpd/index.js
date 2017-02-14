"use strict";

const WebService = require("../web_base");

/**
 * @id lighttpd
 * @group web
 * @label LightTPD
 * @priority 10
 */
module.exports = class LightTpdService extends WebService {

  _composeDocker() {
    let compose = {
      image: "sebp/lighttpd",
    };

    return compose;
  }

};