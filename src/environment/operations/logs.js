"use strict";

/**
 * Print logs operation.
 *
 * @Operation {
 *  @id "logs",
 *  @label "Logs",
 *  @description "Print container logs.",
 *  @arguments {
 *    "service-id": {
 *      "description": "The service ID of which logs to show.",
 *      "default": "By default all container logs will be shown."
 *    }
 *  }
 * }
 */
class LogsOperation {

  /**
   * @inheritDoc
   */
  execute(environment, args, workDir) {
    return environment.getContainer("docker").printLogs(args ? args[0] : null);
  }

}

module.exports = LogsOperation;
