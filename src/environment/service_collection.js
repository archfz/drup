"use strict";

const path = require("path");

const annotatedLoader = require("../ann_loader");

let serviceDiscovery;
let servicePaths = [__dirname];

/**
 * ServiceCollection class.
 *
 * Collects implemented services and acts as an 'Array' of services. Groups
 * the services in categories.
 */
class ServiceCollection {

  /**
   * ServiceCollection constructor.
   */
  constructor() {
    this.servicesByGroup = {};
    this.servicesById = {};
  }

  /**
   * Register services from additional directory.
   *
   * @param {string} path
   *    Directory of services.
   *
   * @returns {ServiceCollection}
   */
  static registerServices(path) {
    if (servicePaths.indexOf(path) === -1) {
      servicePaths.push(path);
    }

    return this;
  }

  /**
   * Gets a collection of the implemented services.
   *
   * @returns {ServiceCollection}
   */
  static collect() {
    if (!serviceDiscovery) {
      serviceDiscovery = new ServiceCollection();
      serviceDiscovery.frozen = true;

      servicePaths.forEach((pth) => {
        annotatedLoader.collectDirectoryClasses(path.join(pth, "services")).forEach((service) => {
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

  /**
   * Adds services to the collection.
   *
   * @param {Service} Service
   */
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

  /**
   * Execute given function for each service.
   *
   * @param {Function} fn
   *    Function that will get a service as parameter.
   */
  each(fn) {
    for (let [id, service] of Object.entries(this.servicesById)) {
      fn(service, id);
    }
  }

  /**
   * Determines whether service is in the collection.
   *
   * @param {string} id
   *    ID of the service.
   *
   * @returns {boolean}
   */
  has(id) {
    return this.servicesById.hasOwnProperty(id);
  }

  /**
   * Gets a service by ID.
   *
   * @param {string} id
   *    ID of the service.
   *
   * @returns {Service}
   */
  get(id) {
    if (!this.has(id)) {
      throw new Error("Tried to get un-existent service by ID: " + id);
    }

    return this.servicesById[id];
  }

  /**
   * Gets all services from a group.
   *
   * @param {string} group
   *    Group name.
   *
   * @returns {Object|boolean}
   *    FALSE if none in group, otherwise Object with services keyed by ID.
   */
  ofGroup(group) {
    return this.servicesByGroup[group] || false;
  }

  /**
   * Gets first service from a group.
   *
   * @param {string} group
   *    Group name.
   *
   * @returns {Service|boolean}
   *    FALSE if none, otherwise the first service.
   */
  firstOfGroup(group) {
    let ofGroup = this.ofGroup(group);

    if (!ofGroup) {
      return false;
    }

    return ofGroup[Object.keys(ofGroup)[0]];
  }

  /**
   * Gets all services not in the given group(s).
   *
   * @param {string|string[]} groups
   *    Group name or array of group names.
   *
   * @returns {Object}
   *    Object with services keyed by ID.
   */
  notOfGroup(groups) {
    if (!Array.isArray(groups)) {
      groups = [groups];
    }

    let services = {};
    // Clone the internal storage.
    Object.assign(services, this.servicesByGroup);

    // Remove all services that are in the provided groups.
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

  /**
   * Remove a service from the collection.
   *
   * @param {string} id
   *    The service ID.
   */
  remove(id) {
    // Prevent removal on frozen collection. This is used for discovery of
    // service classes that shouldn't be removed.
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

  /**
   * Remove all services of a group.
   *
   * @param {string} group
   *    Group name.
   */
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

  /**
   * Gets an array of choices for services of a group.
   *
   * @param {string} group
   *    Group name.
   *
   * @returns {Array.<Object>}
   *    Object containing:
   *      - name: Label of the service.
   *      - value: The ID of the service.
   *      - priority: Priority among of the same group.
   */
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

  /**
   * Clones this collection.
   *
   * @returns {ServiceCollection}
   */
  clone() {
    let collection = new ServiceCollection();

    this.each((service) => {
      service.ann("group");
      collection.addService(service);
    });

    return collection;
  }

}

module.exports = ServiceCollection;
