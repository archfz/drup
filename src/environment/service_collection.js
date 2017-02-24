"use strict";

const path = require("path");

const utils = require("../utils");

let serviceDiscovery;
let servicePaths = [__dirname];

module.exports = class ServiceCollection {

  constructor() {
    this.servicesByGroup = {};
    this.servicesById = {};
  }

  static registerServices(path) {
    if (servicePaths.indexOf(path) === -1) {
      servicePaths.push(path);
    }

    return this;
  }

  static collect() {
    if (!serviceDiscovery) {
      serviceDiscovery = new ServiceCollection();
      serviceDiscovery.frozen = true;

      servicePaths.forEach((pth) => {
        utils.collectAnnotated(path.join(pth, "services"), null, true).forEach((service) => {
          ["id", "label", "group"].forEach((key) => {
            if (!service.annotations[key]) {
              throw new Error(`A service must define the '${key}' annotation.`);
            }
          });

          service.annotations.priority = Number(service.ann("priority") || 0);

          serviceDiscovery.addService(service);
        });
      });
    }

    return serviceDiscovery;
  }

  addService(Service) {
    let [serviceGroup, serviceId] = [Service.ann("group"), Service.ann("id")];

    if (this.servicesById[serviceId]) {
      throw new Error(`Service ID must be unique: duplicate for '${serviceId}'.`);
    }

    this.servicesById[serviceId] = Service;

    if (!this.servicesByGroup[serviceGroup]) {
      this.servicesByGroup[serviceGroup] = {};
    }

    this.servicesByGroup[serviceGroup][serviceId] = Service;
  }

  each(fn) {
    for (let [id, service] of Object.entries(this.servicesById)) {
      fn(service, id);
    }
  }

  has(id) {
    return this.servicesById.hasOwnProperty(id);
  }

  get(id) {
    if (!this.has(id)) {
      throw new Error("Tried to get un-existent service by ID: " + id);
    }

    return this.servicesById[id];
  }

  ofGroup(group) {
    return this.servicesByGroup[group] || false;
  }

  firstOfGroup(group) {
    let ofGroup = this.ofGroup(group);

    if (!ofGroup) {
      return false;
    }

    return ofGroup[Object.keys(ofGroup)[0]];
  }

  notOfGroup(groups) {
    if (!Array.isArray(groups)) {
      groups = [groups];
    }

    let services = {};
    Object.assign(services, this.servicesByGroup);

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

  remove(id) {
    if (this.frozen) {
      throw new Error("Remove not allowed on frozen service collection.");
    }

    if (!this.servicesById[id]) {
      return;
    }

    let group = this.servicesById[id].ann("group");
    delete this.servicesById[id];
    delete this.servicesByGroup[group][id];
  }

  removeGroup(group) {
    if (this.frozen) {
      throw new Error("Remove not allowed on frozen service collection.");
    }

    if (!this.servicesByGroup[group]) {
      return;
    }

    for (const [id] of Object.entries(this.servicesByGroup[group])) {
      delete this.servicesById[id];
    }

    delete this.servicesByGroup[group];
  }

  groupToChoices(group) {
    let services = this.ofGroup(group);

    let choices = [];
    for (let [id, Service] of Object.entries(services)) {
      choices.push({
        name: Service.ann("label"),
        value: id,
        priority: Service.ann("priority") || 0,
      });
    }

    choices.sort((a, b) => a.priority < b.priority);

    return choices;
  }

  clone() {
    let collection = new ServiceCollection();

    this.each((service) => {
      service.ann("group");
      collection.addService(service);
    });

    return collection;
  }

};
