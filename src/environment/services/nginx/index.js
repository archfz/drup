"use strict";

const Service = require("../../service_base");

/**
 * @id nginx
 * @group web
 * @label NGINX
 * @priority 20
 */
module.exports = class NginxService extends Service {

  bindEnvironment(env) {
    super.bindEnvironment(env);

    env.on("composedDocker", this._onComposedDocker.bind(this))
  }

  _composeDocker() {
    return {
      image: "nginx:stable-alpine",
      volumes: [
        `./${this._dir("CONFIG")}/${this.ann("id")}:/etc/nginx/conf.d`,
        `./${this._dir("PROJECT")}:/usr/share/nginx/html`,
      ]
    };
  }

  _onComposedDocker(services) {
    if (this.env.services.has("php")) {
      if (!services["php"].volumes) {
        services["php"].volumes = [];
      }

      services["php"].volumes.push(`./${this._dir("PROJECT")}:/usr/share/nginx/html`);
      services[this.ann("id")].depends_on = ["php"];
    }
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
      doc_root: "",
    };
  }

};