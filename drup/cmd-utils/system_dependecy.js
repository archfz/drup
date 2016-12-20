"use strict";

const exec = require('child_process').exec;

class DependencyCheck {
    constructor([command, version]) {
        if (typeof command !== "string") {
            throw "Command must be of type string.";
        }

        this.dependency = command;
        this.version = version;

        this.promise = new Promise((resolve) => {
            this.resolvePromise = resolve;
        });
    }

    resolve(status) {
        let result = {
            dependency : this.dependency,
            minVersion : this.version
        };

        if (status instanceof Object) Object.assign(result, status);
        else result.status = status;

        this.resolvePromise(result);
    }

    execute() {
        this.command = this.dependency + (this.version ? " --version" : "");

        exec(this.command, (error, stdout) => {
            if (error) {
                return this.resolve(DependencyCheck.NOT_MET);
            }

            if (this.version) {
                let gotVersion = (stdout.match(/ ([\d+].[\d+](.[\d+])?)/) || [])[0];
                let versionParts = this.version.split('.');

                if (!gotVersion) {
                    console.warn(`Could not determine dependency command version:` +
                        `\n '${this.command}' output was: \n${stdout}`);
                    return this.resolve(DependencyCheck.AMBIGUOUS);
                }

                try {
                    gotVersion.split('.').forEach((v, i) => {
                        if (typeof versionParts[i] === "undefined") throw "okay";

                        v = parseInt(v);
                        let min = parseInt(versionParts[i]);

                        if (v < min) throw "old";
                        else if (v > min) throw "okay";
                    });
                } catch (status) {
                    if (status == "old") {
                        return this.resolve({
                            status : DependencyCheck.OUTDATED,
                            currentVersion : gotVersion
                        });
                    } else if (status != "okay") {
                        throw status;
                    }
                }

            }

            return this.resolve(DependencyCheck.MET);
        });

        return this.promise;
    }
}

DependencyCheck.NOT_MET = -1;
DependencyCheck.OUTDATED = 0;
DependencyCheck.MET = 10;
DependencyCheck.AMBIGUOUS = 5;

module.exports = (dependencies) => {
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
