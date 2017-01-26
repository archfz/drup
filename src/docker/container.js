"use strict";

let services = {};

function configureContainer() {

}

class DockerContainer {

  constructor(path = null, servicesConfig = null) {
    if (path) {
      this.path = path;
      this.saved = true;
      return;
    }

    if (!services) {
      this.services = configureContainer();
    }
    else {
      services.forEach((service, key) => {
        this.services['key'] = new services[key](service);
      });
    }
  }

  save(path) {

  }

  compose() {

  }

  start() {

  }

  stop() {

  }

  command() {

  }

  service(type) {

  }

}