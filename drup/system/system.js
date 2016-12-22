"use strict";

const DependencyCheck = require("./system_dependecy");
const SystemCommand = require("./system_command");

module.exports.execute = (command, args) => {
    return new SystemCommand(command, args).execute();
};

module.exports.require = (dependencies) => {
    let requires = [];

    if (Array.isArray(dependencies[0])) {
        dependencies.forEach(dependency => {
            requires.push(new DependencyCheck(dependency).execute());
        });
    } else {
        requires = [new DependencyCheck(dependencies).execute()];
    }


    let resolve, reject;
    let promise = new Promise((res, rej) =>  [resolve, reject] = [res, rej]);

    Promise.all(requires).then(results => {
        let summary = {
            notMet : results.filter(r => r.status == DependencyCheck.NOT_MET),
            outdated : results.filter(r => r.status == DependencyCheck.OUTDATED)
        };

        if (summary.notMet.length || summary.outdated.length) {
            reject(summary);
        } else {
            resolve({
                ambiguous: results.filter(r => r.status == DependencyCheck.AMBIGUOUS)
            });
        }
    });

    return promise;
};