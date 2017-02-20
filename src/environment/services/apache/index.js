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
    return super._composeDocker({
      image: "httpd:alpine",
      volumes: [
        `./${this._dir("CONFIG")}/${this.ann("id")}/httpd.conf:/usr/local/apache2/conf/httpd.conf`
      ]
    });
  }

  _getConfigFileInfo() {
    return [{
      template: "httpd.conf.dot",
      data: {
        DOC_ROOT: this.getDocumentRoot(),
        CONNECT_PHP: this.env.services.has("php"),
        INDEXES: this.config.index_files,
      }
    }];
  }

};