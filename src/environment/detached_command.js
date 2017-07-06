"use strict";

const os = require("os");
const path = require("path");
const upath = require("upath");

const SystemCommand = require("../system/system_command");
const Environment = require("./environment");
const EError = require("../eerror");

/**
 * Provides detached docker command in means of standalone image.
 */
class DetachedCommand extends SystemCommand {

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

    if (os.platform() === "linux") {
      this.dockerArgs.push("--user", "$(id -u)");
    }

    this.setWorkingDirectory(workDir);
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
   * Sets the working directory in container.
   *
   * @param {string} dir
   */
  setWorkingDirectory(dir) {
    if (typeof dir !== "string") {
      throw new EError(`Working directory paths must be string, provided: "${dir}"`);
    }

    // The working directory should always be in posix format as we are only
    // operating on linux in containers.
    dir = upath.normalize(dir);

    // Working directories should always be absolute.
    dir = dir[0] === "/" ? dir : "/" + dir;

    this.workingDirectory = dir;
    let wIndex = this.dockerArgs.indexOf("-w");

    if (wIndex !== -1) {
      this.dockerArgs[wIndex + 1] = dir;
    }
    else {
      this.dockerArgs.push("-w", dir);
    }
  }

  /**
   * Sets relative working directory in container.
   *
   * @param {Environment} environment
   * @param {string} minWorkDir
   *    The minimum relative working directory inside path.
   * @param {string} hostWorkDir
   *    The directory of the host for which to calculate relative path.
   */
  setRelativeWorkingDirectory(environment, minWorkDir = "", hostWorkDir = process.cwd()) {
    let hostRoot = path.join(environment.root, Environment.DIRECTORIES.PROJECT, minWorkDir);
    let contRoot = path.join(this.workingDirectory, minWorkDir);

    // Determine if we are under the root of the project files on the host
    // system, and only if yes append the missing levels to the container
    // working directory.
    if (hostWorkDir.indexOf(hostRoot) === 0) {
      contRoot = path.join(contRoot, hostWorkDir.substr(hostRoot.length));
    }

    this.setWorkingDirectory(contRoot);
  }

  /**
   * @inheritDoc
   */
  getArgumentArray() {
    if (!this._argArray) {
      let dockerArgs = this.dockerArgs;
      dockerArgs.push(this.dockerImage);
      this._argArray = dockerArgs.concat(super.getArgumentArray());
    }

    return this._argArray;
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
