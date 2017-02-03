"use strict";

const inquirer = require("inquirer");

const ServiceCollection = require("./service_collection");
const Environment = require("./environment");

let allServices;

module.exports = class EnvironmentConfigurator {

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

  setGroupsMultiple(groups, bool = true) {
    this._setOptions("group", groups, "multiple", bool);
  }

  setGroupsRequired(groups, bool = true) {
    this._setOptions("group", groups, "required", bool);
  }

  setGroupsRestricted(groups, bool = true) {
    this._setOptions("group", groups, "restricted", bool);
  }

  setServicesRequired(services, bool = true) {
    this._setOptions("service", services, "required", bool);
  }

  setServicesRestricted(services, bool = true) {
    this._setOptions("service", services, "restricted", bool);
  }

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

};