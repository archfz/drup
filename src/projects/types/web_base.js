"use strict";

const readdir = require("readdirp");
const path = require("path");

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

    return super.start(true)
      .then((container) => {
        cont = container;
        return container.getIp("web");
      })
      .then((ip) => {
        return hostManager.addHost(this._config.host_alias, ip)
          .catch((err) => {
            console.warn(`Failed to add host alias.\n${err}\n`);
          })
          .then(() => ip);
      })
      .then((ip) => {
        console.log(this._config.name + " started.");
        console.log(ip + " => " + this._config.host_alias);

        return getContainer ? cont : this
      });
  }

  stop(getContainer = false) {
    let cont;

    super.stop(true)
      .then(() => hostManager.removeHost(this._config.host_alias))
      .then(() => getContainer ? cont : this);
  }

  _onEnvironmentSet(env) {
    for (let [,webService] of Object.entries(env.services.ofGroup("web"))) {
      webService.setDocumentRoot(this._docRoot);
      webService.addIndexFiles(this.ann("index_file"));
    }
  }

  initialize(tempDirectory) {
    return this.findDocumentRoot(tempDirectory)
      .then((root) => {
      console.log(root);
        root = path.normalize(root);
        this._docRoot = root.substr(tempDirectory.length);
        console.log(this._docRoot);
      });
  }

  findDocumentRoot(directory = this.root) {
    return new Promise((res, rej) => {
      let stream = readdir({
        root: directory,
        depth: 3,
        fileFilter: this.ann("index_file")
      }).on("error", rej)
        .on("end", rej)
        .on("data", (entry) => {
          res(entry.fullParentDir);
          stream.destroy();
        });
    }).catch((err) => {
      throw new Error(`Could not find document root for ${this.constructor.name} web project.\n${err}`)
    });
  }

}

module.exports = WebProject;
