"use strict";

const ProjectBase = require("../base");
const EnvConfigurator = require("../../environment/environment_configurator");
const Command = require("../../system/system_command");

/**
 * @id drupal
 */
class DrupalProject extends ProjectBase {

  static getEnvConfigurator() {
    return new EnvConfigurator({
      group: {
        required: ["web", "database"],
        single: ["web", "database"]
      },
      service: {
        required: ["php"],
        restricted: ["mongodb"]
      }
    });
  }

  static isInDirectory(dir) {

  }

  static getInstallationMethods() {
    return {
      standard: "Install new project with composer.",
      issue: "Clone drupal dev to work on issues.",
    };
  }

  static download(method, dir) {
    let cmd;

    switch (method) {
      case "standard":
        cmd = new Command("composer", [
          ["create-project", "drupal-composer/drupal-project:8.x-dev"],
          [dir, "--no-interaction"],
          ["--stability", "dev"],
       ]);
        break;
      default:
        throw new Error("Unhandled installation method: " + method);
    }

    return cmd.execute();
  }

  static postInstall(data) {
    console.log("post install");
  }

}

module.exports = DrupalProject;
