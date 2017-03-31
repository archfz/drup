"use strict";

const inquirer = require("inquirer");

const Projects = require("../projects");
const Loader = require("../terminal-utils/async_loader");

module.exports = {
  description : "Remove project and it's environment.",
  aliases: ["remove", "rm"],
  weight: 30,
  arguments: [
    {
      name: "key",
      description: "The key of the project.",
      default: "Current directory project.",
      optional: true,
    }
  ],

  execute : (key = null) => {
    let projectLoad;
    let loader;

    if (key === null) {
      projectLoad = Projects.loadDir(process.cwd());
    }
    else {
      projectLoad = Projects.load(key);
    }

    projectLoad.then((project) => {
      console.log("You requested to remove: " + project.name.green);
      console.log("This will " + "remove all".red + " your configurations and files.");
      console.log();

      return inquirer.prompt({
        type: "confirm",
        name: "remove",
        message: "Are you sure you want to remove?",
        default: false,
      }).then((data) => {
        if (!data.remove) {
          return;
        }

        loader = new Loader("Removing " + project.name + " ...");
        return project.remove().then((project) => {
          console.log(project.name + " removed.");
        });
      })
    })
    .catch(console.error)
    .then(() => loader && loader.destroy());
  }
};