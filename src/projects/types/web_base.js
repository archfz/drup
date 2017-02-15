"use strict";

const hostManager = require("../../hosts_manager");

const ProjectBase = require("../base");

class WebProject extends ProjectBase {

  static getConfigureQuestions(suggestions) {
    let questions = super.getConfigureQuestions(suggestions);

    questions.push({
      type: "input",
      name: "host_alias",
      message: "Project host alias",
      default: (values) => values.name.toLowerCase().replace(/\s+/g, "-") + ".dev",
    });

    return questions;
  }

  start(getContainer = false) {
    let cont;

    super.start(true)
      .then((container) => cont = container && container.getIp())
      .then((ip) => hostManager.addHost(this._config.host_alias, ip))
      .then(() => getContainer ? cont : this);
  }

  stop(getContainer = false) {
    let cont;

    super.stop(true)
      .then((container) => cont = container && container.getIp())
      .then((ip) => hostManager.removeHost(this._config.host_alias))
      .then(() => getContainer ? cont : this);
  }

}

module.exports = WebProject;
