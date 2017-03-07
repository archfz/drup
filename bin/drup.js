#!/usr/bin/env node
"use strict";

// Make sure to initialize the smart terminal before any output.
require("../src/terminal-utils/smart_term")();
require("../src/terminal-utils/formatter").infect();

const runOperation = require("../src/run_operation");

const args = process.argv.slice(2);
runOperation(args.shift(), args);
