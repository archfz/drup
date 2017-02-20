"use strict";

const ServiceBase = require("../service_base");

const DOCKER_WWW_ROOT = "/var/www/html";

class WebService extends ServiceBase {

  bindEnvironment(env) {
    super.bindEnvironment(env);

    env.on("composedDocker", this._onComposedDocker.bind(this));
  }

  _onComposedDocker(services) {
    if (this.env.services.has("php")) {
      if (!services.php.volumes) {
        services.php.volumes = [];
      }

      services.php.volumes.push(`./${this._dir("PROJECT")}:${DOCKER_WWW_ROOT}`);
      services[this.ann("id")].depends_on = ["php"];
    }
  }

  _composeDocker(composition) {
    if (!composition.volumes) {
      composition.volumes = [];
    }

    composition.volumes.push(`./${this._dir("PROJECT")}:${DOCKER_WWW_ROOT}`);

    return composition;
  }

  setRelativeRoot(path) {
    this.config.relative_root = path.replace(/\\/g, "/");

    if (this.config.relative_root.charAt(0) !== "/") {
      this.config.relative_root = "/" + this.config.relative_root;
    }
  }

  getDocumentRoot() {
    return DOCKER_WWW_ROOT + this.config.relative_root;
  }

  addIndexFiles(index) {
    if (typeof index === "string") {
      index = [index];
    }

    this.config.index_files = this.config.index_files.concat(index);
  }

  static defaults() {
    return {
      relative_root: "/",
      index_files: ["index.html", "index.htm"],
    };
  }

}

module.exports = WebService;
