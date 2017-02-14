"use strict";

const Service = require("../../service_base");

/**
 * @id nginx
 * @group web
 * @label NGINX
 * @priority 20
 */
module.exports = class NginxService extends Service {

  compose_docker() {
    return {
      image: "nginx:stable-alpine",
      volumes: [
        `./config/${this.ann("id")}:/etc/nginx/conf.d`,
      ]
    };
  }

  _getConfigFileInfo() {
    return {
      'default.conf.dot': {
        DOC_ROOT: this.config.doc_root,
        CONNECT_PHP: this.env.services.has("php"),
      }
    };
  }

  static defaults() {
    return {
      doc_root: "/usr/share/nginx/html",
    };
  }

};