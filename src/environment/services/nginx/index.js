"use strict";

const WebService = require("../web_base");

/**
 * @Service {
 *  @id "nginx",
 *  @group "web",
 *  @label "NGINX",
 *  @priority 20,
 *  @aliased true,
 *  @gidName "nginx",
 * }
 */
module.exports = class NginxService extends WebService {

  /**
   * @inheritdoc
   */
  _composeDocker() {
    return {
      build: {
        BASE_IMAGE: "nginx:stable-alpine"
      },
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
    const hasPhp = this.env.services.has("php");

    let serverConfig = {
      template: "default.conf.dot",
      definitions: ["rules"],
      data: {
        DOC_ROOT: this.getDocumentRoot(),
        CONNECT_PHP: hasPhp,
        XDEBUG_ENABLED: hasPhp ? this.env.services.get("php").config.xdebug : false,
        INDEXES: this.config.index_files,
        USE_SSL: false,
      }
    };

    if (this.config.use_ssl) {
      serverConfig.data.USE_SSL = true;
      serverConfig.data.CERTIFICATE_PATH = this.getCertificateMountPath();
      serverConfig.data.CERTIFICATE_KEY_PATH = this.getCertificateKeyMountPath();
    }

    return [serverConfig];
  }

};