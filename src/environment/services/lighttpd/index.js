"use strict";

const WebService = require("../web_base");

/**
 * @id lighttpd
 * @group web
 * @label LightTPD
 * @priority 10
 * @aliased
 */
module.exports = class LightTpdService extends WebService {

  _composeDocker() {
    return super._composeDocker({
      image: "sebp/lighttpd",
      volumes: [
        `./${this._dir("CONFIG")}/${this.ann("id")}/lighttpd.conf:/etc/lighttpd/lighttpd.conf`
      ]
    });
  }

  _getConfigFileInfo() {
    return [{
      template: "lighttpd.conf.dot",
      definitions: ["rules"],
      data: {
        DOC_ROOT: this.getDocumentRoot(),
        CONNECT_PHP: this.env.services.has("php"),
        INDEXES: this.config.index_files,
      }
    }];
  }

};