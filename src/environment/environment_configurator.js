"use strict";

const inquirer = require("inquirer");

const ServiceCollection = require("./service_collection");

let allServices;

/**
 * Environment configurator that defines how an environment can be built.
 * It also provides the base form for the configuration.
 */
class EnvironmentConfigurator {

  /**
   * EnvironmentConfigurator constructor.
   *
   * @param {Object} configuratorOptions
   *    Object defining what services can or cannot be used.
   *    group: {
   *      restricted: [], // restricted services group IDs
   *      required: [], // required at least one of this group
   *      single: [], // only one allowed of this group
   *    },
   *    services: {
   *      restricted: [], // services IDs that are restricted
   *      required: [], // services that are required
   *    }
   */
  constructor(configuratorOptions) {
    if (!allServices) {
      allServices = ServiceCollection.collect();
    }

    if (!configuratorOptions.group) {
      configuratorOptions.group = {};
    }

    if (!configuratorOptions.service) {
      configuratorOptions.service = {};
    }

    this._options = {
      group: {
        restricted: configuratorOptions.group.restricted || [],
        required: configuratorOptions.group.required || [],
        single: configuratorOptions.group.single || [],
      },
      service: {
        restricted: configuratorOptions.service.restricted || [],
        required: configuratorOptions.service.required || [],
      },
    };
  }

  /**
   * Set whether from a group can be multiple services.
   *
   * @param {string|Array.<string>} groups
   *    Group ID or IDs.
   * @param {boolean} multiple
   *    Can be multiple or not.
   */
  setGroupsMultiple(groups, multiple = true) {
    this._setOptions("group", groups, "multiple", multiple);
  }

  /**
   * Sets whether at least one service is required from the group.
   *
   * @param {string|Array.<string>} groups
   *    Group ID or IDs.
   * @param {boolean} required
   *    Required or not.
   */
  setGroupsRequired(groups, required = true) {
    this._setOptions("group", groups, "required", required);
  }

  /**
   * Sets whether the group is restricted.
   *
   * @param {string|Array.<string>} groups
   *    Group ID or IDs.
   * @param {boolean} restricted
   *    Restricted or not.
   */
  setGroupsRestricted(groups, restricted = true) {
    this._setOptions("group", groups, "restricted", restricted);
  }

  /**
   * Sets whether at a specific service is required.
   *
   * @param {string|Array.<string>} services
   *    Service ID or IDs.
   * @param {boolean} required
   *    Required or not.
   */
  setServicesRequired(services, required = true) {
    this._setOptions("service", services, "required", required);
  }

  /**
   * Sets whether at a specific service is restricted.
   *
   * @param {string|Array.<string>} services
   *    Service ID or IDs.
   * @param {boolean} restricted
   *    Restricted or not.
   */
  setServicesRestricted(services, restricted = true) {
    this._setOptions("service", services, "restricted", restricted);
  }

  /**
   * Sets an option of the services/groups possibilities.
   *
   * @param {string} type
   *    "service" or "group".
   * @param {string} ids
   *    The IDs of the type.
   * @param {string} property
   *    The option property to set to.
   * @param {boolean} bool
   *    The value to set it to.
   * @private
   */
  _setOptions(type, ids, property, bool) {
    ids = Array.isArray(ids) ? ids : [ids];

    if (bool) {
      this._options[type][property] = ids.concat(this._options[type][property]);
    }
    else {
      this._options[type][property] = this._options[type][property].filter((id) => {
        return ids.indexOf(id) === -1;
      });
    }
  }

  /**
   * Builds service choices per group for inquirer.
   *
   * @returns {Object}
   * @private
   */
  _buildChoices() {
    let servicePool = ServiceCollection.collect().clone();
    let servicesSelected = new ServiceCollection();

    this._options.group.restricted.forEach((id) => servicePool.removeGroup(id));
    this._options.service.restricted.forEach((id) => servicePool.remove(id));

    this._options.service.required.forEach((id) => {
      servicesSelected.addService(new (servicePool.get(id))());
      servicePool.remove(id);
    });

    let choices = {};

    this._options.group.required.forEach((group) => {
      if (servicesSelected.ofGroup(group) !== false) {
        return;
      }

      choices[group] = {
        type: "checkbox",
        message: "Select " + group.toUpperCase(),
        name: group,
        choices: servicePool.groupToChoices(group),
        validate: (answer) => {
          return (answer.length >= 1) || "You must choose at least one service from this group.";
        }
      };

      servicePool.removeGroup(group);
    });

    this._options.group.single.forEach((group) => {
      if (servicesSelected.ofGroup(group) !== false) {
        servicePool.removeGroup(group);
        return;
      }

      choices[group].type = "list";
      choices[group].message = "Choose " + group.toUpperCase();

      if (choices[group]) {
        delete choices[group].validate;
      }
      else {
        choices[group] = {
          choices: servicePool.groupToChoices(group),
          name: group,
        };

        servicePool.removeGroup(group);
      }
    });

    choices = Object.keys(choices).map((c) => choices[c]);

    let additionalServices = servicePool.notOfGroup([]);
    if (additionalServices) {
      let additional = [];

      for (let [group, services] of Object.entries(additionalServices)) {
        additional.push(new inquirer.Separator(`-- ${group}:`));
        for (let [id, service] of Object.entries(services)) {
          additional.push({value: id, name: service.ann("label")});
        }
      }

      choices.push({
        type: "checkbox",
        name: "additional",
        message: "Select optional services",
        choices: additional
      });
    }

    return choices;
  }

  /**
   * Shows the configuration form and acquires the data from the user.
   *
   * @returns {Promise.<ServiceCollection>}
   *    The services ready configured.
   */
  configure() {
    console.log("\n-- Select services that you require");

    return inquirer.prompt(this._buildChoices()).then((values) => {
      let serviceIds = this._options.service.required;
      for (const [,value] of Object.entries(values)) {
        if (Array.isArray(value)) {
          serviceIds = serviceIds.concat(value);
        }
        else {
          serviceIds.push(value);
        }
      }

      return serviceIds;
    }).then((serviceIds) => {
      return this._configureServices(serviceIds);
    });
  }

  /**
   * Shows the selected services config form and acquires user data.
   *
   * @param {Array.<string>} serviceIds
   *    The selected service IDs.
   *
   * @returns {Promise.<ServiceCollection>}
   * @private
   */
  _configureServices(serviceIds) {
    let promise;
    let services = new ServiceCollection();

    serviceIds.forEach((serviceId) => {
      let service = new (allServices.get(serviceId))();
      services.addService(service);

      if (!promise) {
        promise = service.configure();
      }
      else {
        promise = promise.then(() => service.configure());
      }
    });

    return promise.then(() => services);
  }

}

module.exports = EnvironmentConfigurator;
