"use strict";

const ProjectBase = require("../base");
const EnvConfigurator = require("../../environment/environment_configurator");

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

}

module.exports = DrupalProject;