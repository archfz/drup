#!/usr/bin/env node
"use strict";

// Provide a way to require modules relative to a base path.
global.$SRC = __dirname + '/../src/';

// Make sure to initialize the smart terminal before any output.
require("../src/terminal-utils/smart_term")();
require("../src/terminal-utils/formatter").infect();

const runOperation = require("../src/run_operation");

// Parse the arguments and run the operation.
const args = process.argv.slice(2);
runOperation(args.shift(), args);
