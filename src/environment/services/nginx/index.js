"use strict";

const WebService = require("../web_base");

/**
 * @id nginx
 * @group web
 * @label NGINX
 * @priority 20
 * @aliased
 */
module.exports = class NginxService extends WebService {

  /**
   * @inheritdoc
   */
  _composeDocker() {
    return super._composeDocker({
      image: "nginx:stable-alpine",
      volumes: [
        `./${this._dir("LOG")}/${this.ann("id")}:/var/log/nginx`,
        `./${this._dir("CONFIG")}/${this.ann("id")}:/etc/nginx/conf.d`,
      ]
    });
  }

  /**
   * @inheritdoc
   */
  _getConfigFileInfo() {
    return [{
      template: "default.conf.dot",
      definitions: ["rules"],
      data: {
        DOC_ROOT: this.getDocumentRoot(),
        CONNECT_PHP: this.env.services.has("php"),
        INDEXES: this.config.index_files,
      }
    }];
  }

};