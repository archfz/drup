#!/usr/bin/node

var runOperation = require("./drup/operations");
var process = require("process");

var arguments = process.argv.slice(2);
runOperation(arguments.shift(), arguments);

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