"use strict";

/**
 * Composer environment operation.
 *
 * @Operation {
 *  @id "composer",
 *  @label "Composer",
 *  @description "Run composer commands in environment.",
 *  @aliases "comp",
 * }
 */
class ComposerOperation {

  execute(environment, args, workDir) {
    const cmd = new (require("./commands/composer"))(environment, args, workDir);
    return cmd.inheritStdio().execute();
  }

}

module.exports = ComposerOperation;
