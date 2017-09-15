#!/usr/bin/env node
"use strict";

// Provide a way to require modules relative to a base path.
global.$SRC = __dirname + '/../src/';

// Make sure to initialize the smart terminal before any output.
require("../src/terminal-utils/smart_term")();
require("../src/terminal-utils/formatter").infect();

// Parse and remove options from arguments.
const args = require('../src/cmd_options').parseOptions(process.argv.slice(2));

// Parse the arguments and run the operation.
require("../src/run_operation")(args)
  .then((code) => process.exit(code));
