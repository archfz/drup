"use strict";

const os = require("os");
const fs = require("fs-promise");
const path = require("path");

const WebProject = require("../web_base");
const EnvConfigurator = require("../../../environment/environment_configurator");
const Environment = require("../../../environment/environment");
const ComposerCommand = require("../../../environment/commands/composer");

/**
 * @ProjectType {
 *  @id "drupal",
 *  @index_file "index.php",
 * }
 */
class Drupal extends WebProject {

  /**
   * @inheritdoc
   */
  static getEnvConfigurator() {
    return new EnvConfigurator({
      group: {
        required: ["web", "database"],
        single: ["web", "database"]
      },
      service: {
        required: ["php"],
        restricted: ["mongodb", "lighttpd"]
      }
    });
  }

  /**
   * @inheritdoc
   */
  static isInDirectory(dir, resolveOnPositive = true) {
    return new Promise((res, rej) => {
      if (!resolveOnPositive) {
        [res, rej] = [rej, res];
      }

      fs.readFile(path.join(dir, "composer.json"))
        .catch(() => rej(false))
        .then((content) => {
          if (content.indexOf(`"drupal/core":`) !== -1) {
            res(this.ann("id"));
          }
          else {
            rej(false);
          }
        });
    });
  }

  /**
   * @inheritdoc
   */
  static getCreationMethods() {
    return {
      standard: "Install new project with composer.",
    };
  }

  /**
   * @inheritdoc
   */
  static download(method, dir) {
    let cmd;

    switch (method) {
      case "standard":
        let params = [
          ["create-project", "drupal-composer/drupal-project:8.x-dev"],
          ["../app", "--no-interaction"],
          ["--stability", "dev"],
        ];

        cmd = new ComposerCommand(params, dir);
        break;
      default:
        throw new Error(`Unhandled creation method: "${method}"`);
    }

    return cmd;
  }

  /**
   * @inheritdoc
   */
  _onEnvironmentSet(env) {
    super._onEnvironmentSet(env);

    env.services.get("php").addExtensions("gd");
    this._alterServices(env.services);
    env.on("servicesInitialized", this._alterServices.bind(this));
  }

  /**
   * Reacts to services initialization.
   *
   * @param {Object} services
   *   The service collection.
   *
   * @private
   */
  _alterServices(services) {
    if (services.has("nginx")) {
      services.get("nginx").registerConfigExtension({
        template: path.join(__dirname, "config/nginx/default.conf.dot")
      });
    }
  }

  /**
   * @inheritdoc
   */
  setup() {
    const root = path.join(this.root, Environment.DIRECTORIES.PROJECT);
    return new ComposerCommand(["install"], root)
      .execute()
      .then(() => super.setup());
  }

}

module.exports = Drupal;
