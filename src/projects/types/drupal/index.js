"use strict";

const os = require("os");
const fs = require("fs-promise");
const path = require("path");

const WebProject = require("../web_base");
const EnvConfigurator = require("../../../environment/environment_configurator");
const Environment = require("../../../environment/environment");
const Command = require("../../../system/system_command");

/**
 * @id drupal
 * @index_file index.php
 */
class Drupal extends WebProject {

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

  static getCreationMethods() {
    return {
      standard: "Install new project with composer.",
      issue: "Clone drupal dev to work on issues.",
    };
  }

  static download(method, dir) {
    let cmd;

    switch (method) {
      case "standard":
        let params = [
          ["create-project", "drupal-composer/drupal-project:8.x-dev"],
          [dir, "--no-interaction"],
          ["--stability", "dev"],
        ];

        // In case of windows max path length will be reached and composer
        // create will fail. Prefer source so that this doesn't happen.
        if (os.platform() == "win32") {
          params.push("--prefer-source");
        }

        cmd = new Command("composer", params);
        break;
      default:
        throw new Error("Unhandled creation method: " + method);
    }

    return cmd;
  }

  _onEnvironmentSet(env) {
    super._onEnvironmentSet(env);

    env.services.get("php").addExtensions("gd");

    if (env.services.has("nginx")) {
      env.services.get("nginx").registerConfigExtension({
        template: path.join(__dirname, "config/nginx/default.conf.dot")
      });
    }
  }

  setup() {
    return new Command("composer", ["install"])
      .execute(path.join(this.root, Environment.DIRECTORIES.PROJECT));
  }

}

module.exports = Drupal;
