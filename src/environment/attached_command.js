"use strict";

const path = require("path");
const os = require("os");
const cmdOptions = require("../cmd_options");

const BaseCommand = require("./base_command");

/**
 * Provides command for environment containers.
 * These are good for running executables inside the containers of environments.
 */
class AttachedCommand extends BaseCommand {

  /**
   * Attached command constructor.
   *
   * @param {Environment} environment
   * @param {string} serviceId
   *    The service ID to run executable in.
   * @param {string} executable
   *    The executable name.
   * @param {Array} args
   *    The arguments to pass to executable.
   */
  constructor(environment, serviceId, executable, args) {
    if (!environment.services.has(serviceId)) {
      throw new Error(`Failed to build attached command. Environment does not have service with ID '${serviceId}'.`);
    }

    // Cannot use docker-compose as on windows exec doesn't work.
    super("docker", "exec", args);

    // Enable debugging if required.
    if (cmdOptions.hasOption("--xdebug")) {
      let alias = environment.services.firstOfGroup('web').getDomainAliases()[0];

      this.setEnvironmentVariable("PHP_IDE_CONFIG", "serverName=" + alias);
      this.setEnvironmentVariable("XDEBUG_CONFIG", "remote_enable=1 remote_mode=req remote_port=9000 remote_host=172.17.0.1");
    }

    this.environment = environment;
    this.executable = executable;

    this.dockerArgs.push("-i");

    this.asHostUser(true);

    const containerName = environment.services.get(serviceId).getContainerName();
    this.dockerArgs.push(containerName, executable);
  }

  /**
   * Sets whether to execute the container as the hosts UID.
   *
   * @param {boolean} yes
   *   Whether to execute as host UID or default.
   *
   * @return {AttachedCommand}
   */
  asHostUser(yes = true) {
    if (os.platform() !== "linux") {
      return this;
    }

    if (yes) {
      this.dockerArgs.push("--user", "$(id -u)");
    } else {
      const index = this.dockerArgs.indexOf("--user");
      this.dockerArgs.splice(index, 2);
    }

    return this;
  }

  /**
   * @inheritdoc
   */
  execute(inDir = null) {
    const currentDir = process.cwd();
    process.chdir(this.environment.root);

    return super.execute()
      .then((output) => {
        process.chdir(currentDir);
        return output;
      });
  }

  /**
   * Sets relative working directory in container.
   *
   * @param {string} minWorkDir
   *    The minimum relative working directory inside path.
   * @param {string} hostWorkDir
   *    The directory of the host for which to calculate relative path.
   */
  setRelativeWorkingDirectory(minWorkDir = "", hostWorkDir = process.cwd()) {
    super.setRelativeWorkingDirectory(this.environment, minWorkDir, hostWorkDir);
  }

  /**
   * @inheritDoc
   */
  _addWorkingDirectoryArgument(dir) {
    // Here is a workaround for not having on docker exec working directory
    // option.
    let shCIndex = this.dockerArgs.indexOf('sh -c "');

    if (shCIndex !== -1) {
      this.dockerArgs[shCIndex + 1] = 'cd ' + dir + ' &&';
    } else {
      shCIndex = this.dockerArgs.indexOf(this.executable);
      this.dockerArgs.splice(shCIndex, 0, 'sh -c "', 'cd ' + dir + ' &&');
    }
  }

  /**
   * @inheritDoc
   */
  getArgumentArray() {
    super.getArgumentArray();

    // We must add the closing quote at the end.
    if (!this._argArray && this.dockerArgs.indexOf('sh -c "') !== -1) {
      this._argArray.push('"');
    }

    return this._argArray;
  }


}

module.exports = AttachedCommand;
