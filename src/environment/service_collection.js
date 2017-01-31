"use strict";

const utils = require("../utils");

let serviceDiscovery;

class ServiceCollection {

  constructor() {
    this.servicesByType = {};
    this.servicesByKey = {};
  }

  static collect() {
    if (!serviceDiscovery) {
      serviceDiscovery = new ServiceCollection();

      utils.collectModules(__dirname + "/services").forEach((service) => {
        serviceDiscovery.addService(service);
      });
    }

    return serviceDiscovery;
  }

  addService(Service) {
    let [serviceType, serviceKey] = [Service.getType(), Service.getKey()];

    if (this.servicesByKey[serviceKey]) {
      throw `Service keys must be unique: duplicate for '${serviceKey}'.`;
    }

    this.servicesByKey[serviceKey] = Service;

    if (!this.servicesByType[serviceType]) {
      this.servicesByType[serviceType] = {};
    }

    this.servicesByType[serviceType][serviceKey] = Service;
  }

  each(fn) {
    for (let [key, service] of Object.entries(this.servicesByKey)) {
      fn(key, service);
    }
  }

  get(key) {
    if (!this.servicesByKey[key]) {
      throw "Tried to get un-existent service by key: " + key;
    }

    return this.servicesByKey[key];
  }

  ofType(type) {
    return this.servicesByType[type] || {};
  }

  notOfTypes(types) {
    if (!Array.isArray(types)) {
      types = [types];
    }

    let services = {};
    Object.assign(services, this.servicesByType);

    types.forEach((type) => {
      if (services[type]) {
        delete services[type];
      }
    });

    if (!Object.keys(services).length) {
      return false;
    }

    return services;
  }

  typeToChoices(type) {
    let services = this.ofType(type);

    let choices = [];
    for (let [key, Service] of Object.entries(services)) {
      choices.push({name: Service.getLabel(), value: key});
    }

    return choices;
  }

}

module.exports = ServiceCollection;
