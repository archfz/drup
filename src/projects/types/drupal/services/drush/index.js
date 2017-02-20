"use strict";

const Service = require("../../../../../environment/service_base");

/**
 * @id drush
 * @group misc
 * @label Drush
 */
module.exports = class DrushService extends Service {

  _composeDocker() {
    return {
      image: "drush/drush",
      volumes: [
        `/${this._dir("PROJECT")}:/var/www/html`
      ]
    };
  }

};