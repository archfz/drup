#!/usr/bin/node
"use strict";

// Make sure to initialize the smart terminal before any output.
require("./src/terminal-utils/smart_term")();

const runOperation = require("./src/run_operation");

let args = process.argv.slice(2);
runOperation(args.shift(), args);

/*
TODO:
    - create container base class
        - add container handlers for docker and ansible
        - services should support both

    - create project manager that will discover and provide
      interface to project types for available operations
        - this should wrap the container manager so
          that it will setup containers for projects
        - it should handle stored data about projects
        - it manages IP hosts aliases

    - create project handler base class (ex. drupal, laravel etc)
        - this will be extended by the different project types
        - handles setup of the project
        - can provide additional console operations (ex. drush)

    - logging for container services

    - server watcher that provides a server for all domain aliases
      and on request automatically starts container for project
        - optionally used

NOTES:
    - the process should be in the following order:
        - configure project and download/clone
        - configure container for project
        - post project configuration with available services
        - optional project installation

*/