"use strict";

const utils = require("../utils");

let serviceDiscovery;

class ServiceCollection {

  constructor() {
    this.servicesByType = {};
    this.servicesById = {};
  }

  static collect() {
    if (!serviceDiscovery) {
      serviceDiscovery = new ServiceCollection();

      utils.collectAnnotated(__dirname + "/services").forEach((service) => {
        serviceDiscovery.addService(service);
      });
    }

    return serviceDiscovery;
  }

  addService(Service) {
    let [serviceType, serviceId] = [Service.ann("group"), Service.ann("id")];

    if (this.servicesById[serviceId]) {
      throw new Error(`Service ID must be unique: duplicate for '${serviceId}'.`);
    }

    this.servicesById[serviceId] = Service;

    if (!this.servicesByType[serviceType]) {
      this.servicesByType[serviceType] = {};
    }

    this.servicesByType[serviceType][serviceId] = Service;
  }

  each(fn) {
    for (let [key, service] of Object.entries(this.servicesById)) {
      fn(key, service);
    }
  }

  get(key) {
    if (!this.servicesById[key]) {
      throw new Error("Tried to get un-existent service by key: " + key);
    }

    return this.servicesById[key];
  }

  ofGroup(group) {
    return this.servicesByType[group] || {};
  }

  notOfGroup(groups) {
    if (!Array.isArray(groups)) {
      groups = [groups];
    }

    let services = {};
    Object.assign(services, this.servicesByType);

    groups.forEach((group) => {
      if (services[group]) {
        delete services[group];
      }
    });

    if (!Object.keys(services).length) {
      return false;
    }

    return services;
  }

  groupToChoices(group) {
    let services = this.ofGroup(group);

    let choices = [];
    for (let [id, Service] of Object.entries(services)) {
      choices.push({name: Service.ann("label"), value: id});
    }

    return choices;
  }

}

module.exports = ServiceCollection;
