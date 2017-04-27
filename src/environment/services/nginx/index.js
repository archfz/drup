"use strict";

const WebService = require("../web_base");

/**
 * @Service {
 *  @id "nginx",
 *  @group "web",
 *  @label "NGINX",
 *  @priority 20,
 *  @aliased true,
 * }
 */
module.exports = class NginxService extends WebService {

  /**
   * @inheritdoc
   */
  _composeDocker() {
    return {
      image: "nginx:stable-alpine",
    };
  }

  /**
   * @inheritdoc
   */
  getVolumes() {
    return super.getVolumes([{
      host: `./${this._dir("LOG")}/${this.ann("id")}`,
      container: "/var/log/nginx",
    }, {
      host: `./${this._dir("CONFIG")}/${this.ann("id")}`,
      container: `/etc/nginx/conf.d`,
    }]);
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