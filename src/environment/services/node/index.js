"use strict";

const Service = require("../../service_base");
const inquirer = require("inquirer");

const images = {
  "7.5" : "node:7.5-alpine",
  "6.9" : "node:6.9-alpine",
  "4.7" : "node:4.7-alpine",
};

/**
 * @Service {
 *  @id "node",
 *  @group "engine",
 *  @label "Node",
 * }
 */
module.exports = class NodeService extends Service {

  /**
   * @inheritdoc
   */
  static defineConfiguration() {
    return {
      version: {
        label: "Version",
        default: "7.5",
      },
    };
  }

  /**
   * @inheritdoc
   */
  _configure() {
    let choices = [];
    for (const [key] of Object.entries(images)) {
      choices.push({
        name: key,
      });
    }

    return inquirer.prompt({
      type: "list",
      name: "version",
      message: "Node version:",
      choices: choices,
      default: this.config.version,
    }).then((values) => {
      this.config.version = values.version;
    });
  }

  /**
   * @inheritdoc
   */
  _composeDocker() {
    let compose = {
      image: images[this.config.version],
    };

    return compose;
  }

};