"use strict";

const Projects = require("../projects");

module.exports = {
  description : "Print information about a project.",
  aliases: ["info", "i"],
  weight: 120,
  arguments: [
    {
      name: "key",
      description: "The project key.",
      optional: true,
    }
  ],

  execute : (key = null) => {
    let projectLoad;

    if (key === null) {
      projectLoad = Projects.loadDir(process.cwd());
    }
    else {
      projectLoad = Projects.load(key);
    }

    projectLoad.then((project) => project.printInformation())
      .catch(console.error);

  }
};