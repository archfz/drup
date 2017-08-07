"use strict";

const WebService = require("../web_base");

/**
 * @Service {
 *  @id "apache",
 *  @group "web",
 *  @label "Apache",
 *  @aliased true,
 *  @priority 5,
 *  @gidName "apache",
 * }
 */
module.exports = class ApacheService extends WebService {

  /**
   * @inheritdoc
   */
  _composeDocker() {
    return {
      image: "httpd:alpine",
    };
  }

  /**
   * @inheritdoc
   */
  getVolumes() {
    return super.getVolumes([{
      host: `./${this._dir("CONFIG")}/${this.ann("id")}/httpd.conf`,
      container: "/usr/local/apache2/conf/httpd.conf",
    }]);
  }

  /**
   * @inheritdoc
   */
  _getConfigFileInfo() {
    const hasPhp = this.env.services.has("php");

    let serverConfig = {
      template: "httpd.conf.dot",
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