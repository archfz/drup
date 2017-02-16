"use strict";

const ServiceBase = require("../service_base");

class WebService extends ServiceBase {

  setDocumentRoot(path) {
    this.config.doc_root = path.replace(/\\/g, "/");

    if (this.config.doc_root.charAt(0) !== "/") {
      this.config.doc_root = "/" + this.config.doc_root;
    }
  }

  addIndexFiles(index) {
    if (typeof index === "string") {
      index = [index];
    }

    this.config.index_files = this.config.index_files.concat(index);
  }

  static defaults() {
    return {
      doc_root: "/",
      index_files: ["index.html", "index.htm"],
    };
  }

}

module.exports = WebService;
