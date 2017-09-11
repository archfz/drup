"use strict";

const inquirer = require("inquirer");
const path = require("path");
const os = require("os");

const ServiceBase = require("../service_base");
const OpensslCommand = require("../commands/openssl");

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
      },
      use_ssl: {
        label: "Use SSL (https)",
        default: true,
      },
    };
  }

  /**
   * @inheritDoc
   * @private
   */
  _configure() {
    return inquirer.prompt([{
      type: "confirm",
      name: "use_ssl",
      message: this.constructor.defineConfiguration().use_ssl.label + "?",
      default: !!this.config.use_ssl,
    }]).then((values) => {
      this.config.use_ssl = values.use_ssl;
    })
  }

  /**
   * @inheritdoc
   */
  bindEnvironment(env) {
    super.bindEnvironment(env);

    env.onAssoc("composedDocker", (servicesComposition) => {
      // Make sure the php
      if (this.env.services.has("php")) {
        servicesComposition[this.ann("id")].depends_on = ["php"];
      }
    }, this);

    env.onAssoc("getServiceVolumes", (service, volumes) => {
      if (service.ann("id") === "php") {
        // If the environment has PHP than add the project volume to it
        // as-well so PHP-FPM can access the files.
        volumes.push({
          host: `./${this._dir("PROJECT")}`,
          container: WebService.DOCKER_WWW_ROOT,
        });
      }
    }, this);

    // In case of SSL enabled generate self signed certificate.
    if (this.config.use_ssl) {
      env.onAssoc("writingConfigFiles", () => {
        const certDir = this.getCertificateDirectory();
        const envId = this.env.getId();

        return new OpensslCommand({
          ISSUER_NAME: envId,
          PUBLIC_NAME: envId,
          ROOT_NAME: envId,
          ORGANISATION: this.env.config.name,
          PUBLIC_CN: "*." + this.getDomainAliases().shift(),
          DAYS: 100000, // This is development, last forever.
        }, certDir).execute();
      }, this);
    }
  }

  /**
   * @inheritdoc
   */
  getVolumes(volumes = []) {
    volumes.push({
      host: `./${this._dir("PROJECT")}`,
      container: WebService.DOCKER_WWW_ROOT,
    });

    if (this.config.use_ssl) {
      volumes.push({
        host: `./${this._dir("CONFIG")}/${this.ann("id")}/${WebService.SSL_CERTIFICATE_DIR}`,
        container: OpensslCommand.CERTIFICATES_DIR,
      });
    }

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
    return WebService.DOCKER_WWW_ROOT + this.config.relative_root;
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

    index = index.filter((ind) => this.config.index_files.indexOf(ind) === -1);
    this.config.index_files = this.config.index_files.concat(index);
  }

  /**
   * Gets the host certificate directory.
   *
   * @return {string}
   *   Path to certificate directory.
   */
  getCertificateDirectory() {
    return path.join(
      this.env.root, 
      this._dir("CONFIG"), 
      this.ann("id"), 
      WebService.SSL_CERTIFICATE_DIR
    );
  }

  /**
   * Gets the container path for the certificate.
   *
   * @return {string}
   *   The certificate path.
   */
  getCertificateMountPath() {
    return OpensslCommand.CERTIFICATES_DIR + "/" + this.env.getId() + ".crt";
  }

  /**
   * Gets the container path for the certificate key.
   *
   * @return {string}
   *   The certificate key path.
   */
  getCertificateKeyMountPath() {
    return OpensslCommand.CERTIFICATES_DIR + "/" + this.env.getId() + ".key";
  }

}

WebService.DOCKER_WWW_ROOT = "/var/www/html";
// The SSL certificates directory on the host.
WebService.SSL_CERTIFICATE_DIR = "certificate";

module.exports = WebService;
