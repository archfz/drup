"use strict";

/**
 * MySQL service operation.
 *
 * @Operation {
 *  @id "mysql_dump",
 *  @label "Dump MySQL",
 *  @description "Dump the mysql database.",
 *  @aliases "sql-dump",
 * }
 */
class MysqlDumpOperation {

  execute(environment, args, workDir) {
    let cmd = new (require("./commands/mysql_dump"))(environment, args, workDir);
    return cmd.execute();
  }

}

module.exports = MysqlDumpOperation;
