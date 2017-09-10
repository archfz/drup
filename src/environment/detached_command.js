"use strict";

const os = require("os");
const path = require("path");
const upath = require("upath");

const BaseCommand = require("./base_command");
const Environment = require("./environment");

/**
 * Provides detached docker command in means of standalone image.
 */
class DetachedCommand extends BaseCommand {

  /**
   * Detached command constructor.
   *
   * @param {string} image
   *    The container image.
   * @param {string} workDir
   *    The working directory in the container.
   * @param {Array} args
   *    The arguments to send to the executable in the container.
   */
  constructor(image, workDir, args) {
    super("docker", args);

    this.dockerImage = image;
    this.dockerArgs = ["run", "-i", "--rm"];

    this.asHostUser(true);

    this.setWorkingDirectory(workDir);
  }

  /**
   * Sets whether to execute the container as the hosts UID.
   *
   * @param {boolean} yes
   *   Whether to execute as host UID or default.
   *
   * @return {DetachedCommand}
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
   * Connects environments network to this the commands container network.
   *
   * @param {Environment} environment
   */
  connectNetwork(environment) {
    const netIndex = this.dockerArgs.indexOf("--network");
    const network = environment.getContainer("docker").getNetworkName();

    if (netIndex !== -1) {
      this.dockerArgs[netIndex + 1] = network;
    }
    else {
      this.dockerArgs.push("--network", network);
    }
  }

  /**
   * Mounts environments directories to the command container.
   *
   * @param {Environment} environment
   * @param {string} mountPath
   *   (Optional) Overrides primary mount directory inside path.
   */
  mountEnvironment(environment, mountPath = null) {
    this.mountVolume(
      path.join(environment.root, Environment.DIRECTORIES.PROJECT),
      mountPath || environment.getProjectMountDirectory()
    );
  }

  /**
   * Mounts directory to the command container.
   *
   * @param {string} hostDir
   * @param {string} containerDir
   */
  mountVolume(hostDir, containerDir) {
    this.dockerArgs.push("-v", path.normalize(hostDir) + ":" + path.posix.normalize(containerDir));
  }

  /**
   * @inheritdoc
   */
  execute(dir = null) {
    if (dir !== null) {
      this.mountVolume(dir, this.workingDirectory);
    }

    return super.execute();
  }

}

module.exports = DetachedCommand;
