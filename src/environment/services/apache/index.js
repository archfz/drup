"use strict";

const WebService = require("../web_base");

/**
 * @id apache
 * @group web
 * @label Apache
 * @aliased
 * @priority 5
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