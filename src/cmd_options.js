"use strict";

let options = [];

module.exports = {

  // The used/known options.
  knownOptions: {
    '--no-tty': {
      description: 'In case of running commands in containers this prevents allocating a TTY.'
    },
  },

  /**
   * Parses options from the initial arguments.
   *
   * @param {Array.<string>} argv
   *   The initial argument list.
   *
   * @return {Array.<string>}
   *   The arguments without the options.
   */
  parseOptions: function (argv) {
    options = [];

    for (let i = 0; i < argv.length; ++i) {
      if (argv[i].match(/--[^ ]+/)) {
        if (!this.knownOptions[argv[i]]) {
          console.warn('Un-known option: ' + argv[i]);
        }

        options.push(argv[i]);
      } else {
        break;
      }
    }

    return argv.slice(options.length);
  },

  /**
   * Determines whether option was set.
   *
   * @param {string}option
   *   Option to search for.
   *
   * @return {boolean}
   */
  hasOption: function (option) {
    return options.indexOf(option) !== -1;
  },

};
