"use strict";

const readdir = require("readdirp");
const path = require("path");
const inquirer = require("inquirer");

const ProjectBase = require("../base");

class WebProject extends ProjectBase {

  static configure(suggestions) {
    return super.configure(suggestions)
      .then((values) => {
        console.log();
        console.log("Insert a domain alias base name. This should not contain an extension, as extensions will be the service ID name. So if you enter for example \"example\" one of your generated aliases might be \"example.nginx\".".green);

        return inquirer.prompt({
          type: "input",
          name: "host_alias",
          message: "Project domain alias:",
          default: values.name.toLowerCase().replace(/\s+/g, "-"),
          validate: (str) => {
            return str.match(/^[a-z\-0-9]+$/) ? true : "Should only contain a domain name, without extension.";
          }
        }).then((val) => {
          return Object.assign(values, val);
        });
      });
  }

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
