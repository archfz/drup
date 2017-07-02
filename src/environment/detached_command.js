"use strict";

const path = require("path");

const SystemCommand = require("../system/system_command");
const Environment = require("./environment");

class DetachedCommand extends SystemCommand {

  constructor(image, workDir, args) {
    super("docker", args);

    this.dockerImage = image;
    this.dockerArgs = ["run", "-i", "--rm"];

    this.setWorkingDirectory(workDir);
  }

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

  mountEnvironment(environment) {
    this.mountVolume(
      path.join(environment.root, Environment.DIRECTORIES.PROJECT),
      environment.getProjectMountDirectory()
    );
  }

  mountVolume(hostDir, containerDir) {
    this.dockerArgs.push("-v", path.normalize(hostDir) + ":" + path.normalize(containerDir));
  }

  setWorkingDirectory(dir) {
    this.workingDirectory = dir;
    let wIndex = this.dockerArgs.indexOf("-w");

    if (wIndex !== -1) {
      this.dockerArgs[wIndex + 1] = dir;
    }
    else {
      this.dockerArgs.push("-w", dir);
    }
  }

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
