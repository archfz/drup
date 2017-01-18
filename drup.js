#!/usr/bin/node
"use strict";

// Make sure to initialize the smart terminal before any output.
require("./src/terminal-utils/smart_term")();

const runOperation = require("./src/operations");
const process = require("process");
const system = require("./src/system/system");
const Task = require("./src/task/task");
const Action = require("./src/task/action");
const Loader = require("./src/terminal-utils/async_loader");
const data = require("./src/drup_storage");

class RequireDependencies extends Action {

    _doWork() {
        this.loader = new Loader('Requiring dependencies.');
        return system.require([['php', '8.0'], ['mysql', '1'], ['vim', '12']]);
    }

    _onCompleted() {
        this.loader.finish('requirements met');
    }

    _onFailed() {
        this.loader.finish('requirements unmet');
    }

    _doRevert() {
        console.log("Nothing to revert in example.");
        return true;
    }

}

console.log("name = " + data.config.get('name'));
data.config.set('name', Math.random() + " name");

let checkRequirementsTask = new Task();
checkRequirementsTask.complete(new RequireDependencies()).on('complete', () => console.log('_completed'));

let l1 = new Loader("Installing Docker");

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