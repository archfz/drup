"use strict";

const ServiceBase = require("../service_base");

class WebService extends ServiceBase {

  setDocumentRoot(path) {
    this.config.doc_root = path;
  }

  setIndexFiles(indexes) {
    this.config.index = index;
  }

  static defaults() {
    return {
      doc_root: "",
      index_files: ["index.html", "index.htm"],
    }
  }

}

module.exports = WebService;
