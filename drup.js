#!/usr/bin/node
"use strict";

// Make sure to initialize the smart terminal before any output.
require("./drup/cmd-utils/smart_term")();

var runOperation = require("./drup/operations");
var process = require("process");

const Loader = require("./drup/cmd-utils/async_loader");

new Loader("Installing Drupal");
let l1 = new Loader("Installing Docker");
new Loader("Cloning project");

setTimeout(function(){l1.finish()}, 4000);

let args = process.argv.slice(2);
runOperation(args.shift(), args);

/*
commands:
    setup [<issue-number>]
    remove [<issue-number/directory>] 
    work [<issue-number/directory>] //create workspace for issue

issueParser(issueNumber)
function getProject();
function getBranch();

drupal
function download();
function update();
function setBranch(branch);
function install();
function remove();
function clone();

mysql
function setConfig(config);
function loadConfig(config);
function createDatabase(name);
function databaseExists(name);
function databaseDrop(name);

issueStore
function get();
function create();
function update();
function remove();

apacheSite
function setup();
function remove();

issue
function setup();
function remove();
function work();
*/