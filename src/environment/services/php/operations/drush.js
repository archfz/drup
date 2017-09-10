"use strict";

/**
 * Drush environment operation.
 *
 * @Operation {
 *  @id "drush",
 *  @label "Drush",
 *  @description "Run drush command in environment.",
 *  @aliases "dr",
 *
 *  @types "drupal",
 * }
 */
class DrushOperation {

  /**
   * @inheritDoc
   */
  execute(environment, args, workDir) {
    const cmd = new (require("./commands/drush"))(environment, args, workDir);
    return cmd.inheritStdio().execute();
  }

}

module.exports = DrushOperation;
