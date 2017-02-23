"use strict";

module.exports = {
  description : "List all environments and their state.",
  aliases: ["list", "ls"],
  weight: 50,
  arguments: [
    {
      name: "type",
      description: "Types of projects to list.",
      optional: true,
    }
  ],

  execute : () => {

  }
};