"use strict";

/**
 * Shell environment operation.
 *
 * @Operation {
 *  @id "shell",
 *  @label "Shell Terminal",
 *  @description "Start shell terminal in environment container.",
 *  @aliases "sh",
 *  @arguments {
 *    "service-id": {
 *      "description": "Service ID for which to open terminal."
 *    }
 *  }
 * }
 */
class ShellOperation {

  /**
   * @inheritDoc
   */
  execute(environment, args, workDir) {
    if (args.length < 1) {
      throw new Error("You must provide the service ID for which to create the shell terminal.");
    }

    const cmd = new (require("./commands/shell"))(environment, args.shift(), workDir);

    // Don't bind host user because we want super admin access.
    cmd.asHostUser(false);

    return cmd.inheritStdio().execute();
  }

}

module.exports = ShellOperation;
