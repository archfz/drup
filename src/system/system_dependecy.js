"use strict";

const SystemCommand = require('./system_command');

class DependencyCheck extends SystemCommand {

    constructor([command, version]) {
        let args = [];
        if (version) {
            args.push(['--version']);
        }

        super(command, args);

        this.dependency = command;
        this.version = version;
    }

    finalResolve(status) {
        let result = {
            dependency : this.dependency,
            minVersion : this.version
        };

        if (status instanceof Object) {
            Object.assign(result, status);
        }
        else {
            result.status = status;
        }

        this.resolvePromise(result);
    }

    resolve(output) {
        if (this.version) {
            let gotVersion = (output.match(/ ([\d+].[\d+](.[\d+])?)/) || [])[0];
            let versionParts = this.version.split('.');

            if (!gotVersion) {
                console.warn(`Could not determine dependency command version:` +
                    `\n '${this.command}' output was: \n${output}`);
                return this.finalResolve(DependencyCheck.AMBIGUOUS);
            }

            try {
                gotVersion.split('.').forEach((v, i) => {
                    if (typeof versionParts[i] === "undefined"){ throw "okay";}

                    v = parseInt(v);
                    let min = parseInt(versionParts[i]);

                    if (v < min){ throw "old";}
                    else if (v > min){ throw "okay";}
                });
            } catch (status) {
                if (status === "old") {
                    return this.finalResolve({
                        status : DependencyCheck.OUTDATED,
                        currentVersion : gotVersion
                    });
                } else if (status !== "okay") {
                    throw status;
                }
            }

        }

        return this.finalResolve(DependencyCheck.MET);
    }

    reject(error) {
        return this.finalResolve(DependencyCheck.NOT_MET);
    }

}

DependencyCheck.NOT_MET = -1;
DependencyCheck.OUTDATED = 0;
DependencyCheck.MET = 10;
DependencyCheck.AMBIGUOUS = 5;

module.exports = DependencyCheck;