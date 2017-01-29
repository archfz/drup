"use strict";

class ServiceCollection {

  constructor() {
    this.servicesByType = {};
    this.servicesByKey = {};
  }

  static collect() {
    let collection = new ServiceCollection();

    require("fs").readdirSync(__dirname + "/services").forEach(function(file) {
      collection.addService(require(file));
    });

    return collection;
  }

  addService(Service) {
    let [serviceType, serviceKey] = [Service.getType(), Service.getKey()];

    this.servicesByKey[serviceKey] = Service;

    if (!this.servicesByType[serviceType]) {
      this.servicesByType[serviceType] = {};
    }

    this.servicesByType[serviceType][serviceKey] = Service;
  }

  each(fn) {
    for (let [key, service] of Object.entries(this.servicesByType)) {
      fn(key, service);
    }
  }

  get(key) {
    return this.servicesByKey[key];
  }

  ofType(type) {
    return this.servicesByType[type];
  }

}

exports = ServiceCollection;
