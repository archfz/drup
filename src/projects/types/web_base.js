"use strict";

const readdir = require("readdirp");
const path = require("path");
const inquirer = require("inquirer");

const ProjectBase = require("../base");
const AliasInput = require("../inputs/alias_input");

const EError = require("../../eerror");

/**
 * Base class for web projects.
 */
class WebProject extends ProjectBase {

  /**
   * @inheritdoc
   */
  static configure(suggestions) {
    return super.configure(suggestions)
      .then((values) => {
        console.log();

        return AliasInput.create()
          .acquire(values.name.toLowerCase().replace(/\s+/g, "-"))
          .then((alias) => {
            return Object.assign(values, {host_alias: alias});
          });
      });
  }

  /**
   * @inheritdoc
   */
  _onEnvironmentCreated(env, tempDirectory) {
    return this.findDocumentRoot(tempDirectory)
      .then((root) => {
        root = path.normalize(root);
        let docRoot = root.substr(tempDirectory.length);

        for (let [,webService] of Object.entries(env.services.ofGroup("web"))) {
          webService.setRelativeRoot(docRoot);
          webService.addIndexFiles(this.ann("index_file"));
        }
      });
  }

  /**
   * Gets the full path to document root of the project.
   *
   * @param {string} directory
   *    Index file search directory.
   *
   * @returns {Promise}
   * @resolve {string}
   *    The directory of the index file.
   */
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
      throw new EError(`Could not find document root for ${this.constructor.name} web project.`).inherit(err);
    });
  }

}

module.exports = WebProject;
