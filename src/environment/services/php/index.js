"use strict";

const inquirer = require("inquirer");
const os = require("os");

const Service = require("../../service_base");

const versions = ["7.1", "7.0" , "5.6" ];

/**
 * @id php
 * @group engine
 * @label PHP
 */
module.exports = class PhpService extends Service {

  /**
   * @inheritdoc
   */
  static defineConfiguration() {
    return {
      version: {
        label: "Version",
        default: "7.1",
      },
      xdebug: {
        label: "XDebug enabled",
        default: true,
      },
      additional_extensions: {
        label: "Additional PHP extensions",
        default: ["opcache"],
      },
      ini_settings: {
        label: "Custom INI settings",
        default: [],
      },
    };
  }

  /**
   * @inheritdoc
   */
  _configure() {
    let choices = [];
    versions.forEach((version) => {
      choices.push({
        name: version,
        checked: version == this.config.version,
      });
    });

    return inquirer.prompt([{
      type: "list",
      name: "version",
      message: "PHP version:",
      choices: choices,
    }, {
      type: "confirm",
      name: "xdebug",
      message: "Enabled xDebug?",
      default: true,
    }]).then((values) => {
      this.config.version = values.version;
      this.config.xdebug = values.xdebug ? 1 : 0;
    });
  }

  /**
   * @inheritdoc
   */
  _composeDocker() {
    let compose = {
      build: {
        PHP_VERSION: this.config.version,
        PHP_XDEBUG: this.config.xdebug,
        PHP_EXTENSIONS: this.config.additional_extensions,
      },
    };

    // Allow running php-fpm as root user on windows. See at config files for
    // explanation.
    if (os.platform() === "win32") {
      compose.entrypoint = ["php-fpm", "--allow-to-run-as-root"];
    }

    return compose;
  }

  /**
   * @inheritdoc
   */
  getVolumes() {
    return super.getVolumes([{
      host: `./config/${this.ann("id")}/custom.ini`,
      container: "/usr/local/etc/php/conf.d/custom.ini",
    }, {
      host: `./config/${this.ann("id")}/www.conf`,
      container:  "/usr/local/etc/php-fpm.d/www.conf",
    }]);
  }

  /**
   * Adds additional PHP extensions.
   *
   * @param {string|string[]} extension
   *    Add PHP extension to be installed. (ex: gd, zip ..)
   */
  addExtensions(extension) {
    if (typeof extension === "string") {
      extension = [extension];
    }

    this.config.additional_extensions = this.config.additional_extensions
      .concat(extension).filter((ext, i, arr) => arr.indexOf(ext) == i);
  }

  /**
   * @inheritdoc
   */
  _getConfigFileInfo() {
    return [{
      template: "custom.ini.dot",
      definitions: ["rules"],
      data: {
        XDEBUG: this.config.xdebug,
        INI_SETTINGS: this.config.ini_settings
      }
    }, {
      template: "www.conf.dot",
      commentChar: ";",
      data: {
        // In case of windows we need to make sure the php-fpm is run as the
        // root user, because otherwise we can't upload files.
        USER: os.platform() === "win32" ? "root" : "www-data",
        GROUP: os.platform() === "win32" ? "root" : "www-data",
      }
    }];
  }

};