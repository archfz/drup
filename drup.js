#!/usr/bin/node
"use strict";

// Make sure to initialize the smart terminal before any output.
require("./drup/terminal-utils/smart_term")();

var runOperation = require("./drup/operations");
var process = require("process");
var requireCommand = require("./drup/terminal-utils/system_dependecy");

requireCommand([['php', '8.0'], ['mysql', '1'], ['vim', '12']]).then(got => {
    console.log(got);
}, reason => {
    console.log(reason);
});

const Loader = require("./drup/terminal-utils/async_loader");

new Loader("Installing Drupal");
let l1 = new Loader("Installing Docker");
new Loader("Cloning project");

setTimeout(function(){l1.finish()}, 4000);

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

    - container base class that will be extended by the different containers
    - docker composer which assembles containers
*/