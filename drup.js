#!/usr/bin/node
"use strict";

var runOperation = require("./drup/operations");
var process = require("process");

//require("./drup/cmd").createLoader(100);

// class Stream extends Duplex {
//     constructor(options) {
//         super(options);
//
//         process.stdin.setRawMode(true);
//         process.stdin.pipe(this);
//         this.pipe(process.stdout);
//
//         this.once('^C', process.exit);
//     }
//
//     _write(chunk, encoding, callback) {
//         console.log("asd");
//         callback();
//     }
//
//     _read(size) {
//         console.log("wtf");
//     }
// }
//
// var st = new Stream();
// console.log("asd");
//
var opterm = require("./drup/op_term")();

'use strict';
var inquirer = require('inquirer');
console.log('Hi, welcome to Node Pizza');

var questions = [
    {
        type: 'confirm',
        name: 'toBeDelivered',
        message: 'Is this for delivery?',
        default: false
    },
    {
        type: 'input',
        name: 'phone',
        message: 'What\'s your phone number?',
        validate: function (value) {
            var pass = value.match(/^([01]{1})?[-.\s]?\(?(\d{3})\)?[-.\s]?(\d{3})[-.\s]?(\d{4})\s?((?:#|ext\.?\s?|x\.?\s?){1}(?:\d+)?)?$/i);
            if (pass) {
                return true;
            }

            return 'Please enter a valid phone number';
        }
    },
    {
        type: 'list',
        name: 'size',
        message: 'What size do you need?',
        choices: ['Large', 'Medium', 'Small'],
        filter: function (val) {
            return val.toLowerCase();
        }
    },
    {
        type: 'input',
        name: 'quantity',
        message: 'How many do you need?',
        validate: function (value) {
            var valid = !isNaN(parseFloat(value));
            return valid || 'Please enter a number';
        },
        filter: Number
    },
    {
        type: 'expand',
        name: 'toppings',
        message: 'What about the toppings?',
        choices: [
            {
                key: 'p',
                name: 'Pepperoni and cheese',
                value: 'PepperoniCheese'
            },
            {
                key: 'a',
                name: 'All dressed',
                value: 'alldressed'
            },
            {
                key: 'w',
                name: 'Hawaiian',
                value: 'hawaiian'
            }
        ]
    },
    {
        type: 'rawlist',
        name: 'beverage',
        message: 'You also get a free 2L beverage',
        choices: ['Pepsi', '7up', 'Coke']
    },
    {
        type: 'input',
        name: 'comments',
        message: 'Any comments on your purchase experience?',
        default: 'Nope, all good!'
    },
    {
        type: 'list',
        name: 'prize',
        message: 'For leaving a comment, you get a freebie',
        choices: ['cake', 'fries'],
        when: function (answers) {
            return answers.comments !== 'Nope, all good!';
        }
    }
];

inquirer.prompt(questions).then(function (answers) {
    console.log('\nOrder receipt:');
    console.log(JSON.stringify(answers, null, '  '));
});
/*var arguments = process.argv.slice(2);
runOperation(arguments.shift(), arguments);*/

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