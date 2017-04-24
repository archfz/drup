"use strict";

const ServiceBase = require("../service_base");

const DOCKER_WWW_ROOT = "/var/www/html";

/**
 * WebService base class.
 */
class WebService extends ServiceBase {

  /**
   * @inheritdoc
   */
  static defineConfiguration() {
    return {
      relative_root: {
        label: "Document relative root",
        default: "/",
      },
      index_files: {
        label: "Index files",
        default: ["index.html", "index.htm"],
      }
    };
  }

  /**
   * @inheritdoc
   */
  bindEnvironment(env) {
    super.bindEnvironment(env);

    env.on("composedDocker", (servicesComposition) => {
      // Make sure the php
      if (this.env.services.has("php")) {
        servicesComposition[this.ann("id")].depends_on = ["php"];
      }
    });

    env.on("getServiceVolumes", (service, volumes) => {
      if (service.ann("id") === "php") {
        // If the environment has PHP than add the project volume to it
        // as-well so PHP-FPM can access the files.
        volumes.push({
          host: `./${this._dir("PROJECT")}`,
          container: DOCKER_WWW_ROOT,
        });
      }
    });
  }

  /**
   * @inheritdoc
   */
  getVolumes(volumes = []) {
    volumes.push({
      host: `./${this._dir("PROJECT")}`,
      container: DOCKER_WWW_ROOT,
    })

    return super.getVolumes(volumes);
  }

  /**
   * Set the project folder relative document root.
   *
   * @param {string} path
   *    Directory path from the root/project directory.
   */
  setRelativeRoot(path) {
    this.config.relative_root = path.replace(/\\/g, "/");

    if (this.config.relative_root.charAt(0) !== "/") {
      this.config.relative_root = "/" + this.config.relative_root;
    }
  }

  /**
   * Gets the document root.
   *
   * @returns {string}
   *    Path to document root.
   */
  getDocumentRoot() {
    return DOCKER_WWW_ROOT + this.config.relative_root;
  }

  /**
   * Add additional index files.
   *
   * @param {string|string[]} index
   *    Index or array of indexes.
   */
  addIndexFiles(index) {
    if (typeof index === "string") {
      index = [index];
    }

    this.config.index_files = this.config.index_files.concat(index);
  }

}

module.exports = WebService;
