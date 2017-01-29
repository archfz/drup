#!/usr/bin/node
"use strict";

// Make sure to initialize the smart terminal before any output.
require("./src/terminal-utils/smart_term")();

const runOperation = require("./src/operations");

let args = process.argv.slice(2);
runOperation(args.shift(), args);

/*
TODO: Create
    - dependency checker module that can accept them as params.
    - command runner that uses async loader and handles errors.
    - history tracker module to undo actions on failures.
    - json configuration loader/saver that handlers errors.

    - drupal class that handles everything for drupal website
        - get from the 3 types
        - read and write to settings.php
        - install

    - container base class that will be extended by the different services
    - docker composer which assembles services
*/