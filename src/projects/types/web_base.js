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

        let defaultAliases;
        if (suggestions.config.host_alias) {
          defaultAliases = suggestions.config.host_alias;
        }
        else if (suggestions.config.host_aliases) {
          defaultAliases = suggestions.config.host_aliases.join(", ");
        }
        else {
          defaultAliases = values.name.toLowerCase().replace(/\s+/g, "-");
        }

        return AliasInput.create()
          .acquire(defaultAliases)
          .then((aliases) => {
            return Object.assign(values, {host_aliases: aliases});
          });
      });
  }

  /**
   * @inheritdoc
   */
  _onEnvironmentSet(env) {
    env.on("compileStarted", this._setWebDocumentRoot.bind(this));
  }

  /**
   * Finds and sets the document root of the website.
   *
   * @returns {Promise}
   * @private
   */
  _setWebDocumentRoot() {
    let environment;
    let projectRoot;

    return this.getEnvironment()
      .then((env) => {
        environment = env;
        projectRoot = path.join(env.root, env.constructor.DIRECTORIES["PROJECT"]);
        return this.findDocumentRoot(projectRoot);
      })
      .then((root) => {
        root = path.normalize(root);
        let docRoot = root.substr(projectRoot.length);

        for (let [,webService] of Object.entries(environment.services.ofGroup("web"))) {
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
