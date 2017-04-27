"use strict";

const WebService = require("../web_base");

/**
 * @Service {
 *  @id "lighttpd",
 *  @group "web",
 *  @label "LightTPD",
 *  @priority 10,
 *  @aliased true,
 * }
 */
module.exports = class LightTpdService extends WebService {

  /**
   * @inheritdoc
   */
  _composeDocker() {
    return {
      image: "sebp/lighttpd",
    };
  }

  /**
   * @inheritdoc
   */
  getVolumes() {
    return super.getVolumes([{
      host: `./${this._dir("CONFIG")}/${this.ann("id")}/lighttpd.conf`,
      container: "/etc/lighttpd/lighttpd.conf",
    }]);
  }

  /**
   * @inheritdoc
   */
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