"use strict";

const fs = require("fs-promise");

const DetachedCommand = require("../detached_command");

/**
 * Command to generate SSL certificate.
 */
class OpensslCommand extends DetachedCommand {

  /**
   * Openssl command constructor.
   *
   * @param {Object} variables
   *   Variables for the certificate generation. See image documentation.
   * @param {string} mountDirectory
   *   The host mount directory. This is where certificates will be generated.
   */
  constructor(variables, mountDirectory) {
    super(OpensslCommand.IMAGE, OpensslCommand.CERTIFICATES_DIR, []);

    // We have to change the default directory so we can create files as the
    // owner of the host.
    variables.CERT_DIR = OpensslCommand.CERTIFICATES_DIR;

    for (const [varName, value] of Object.entries(variables)) {
      this.dockerArgs.push("-e", `${varName}="${value}"`);
    }

    this.mountVolume(mountDirectory, OpensslCommand.CERTIFICATES_DIR);
    this.primaryMount = mountDirectory;
  }

  /**
   * @inheritDoc
   */
  execute(dir) {
    // We have to make sure the directory exists before executing.
    // Otherwise the container will create the directory and it
    // will be owned by root.
    return fs.ensureDir(this.primaryMount)
      .then(() => super.execute(dir));
  }

}

OpensslCommand.IMAGE = "pgarrett/openssl-alpine";
OpensslCommand.CERTIFICATES_DIR = "/home/certs";

module.exports = OpensslCommand;
