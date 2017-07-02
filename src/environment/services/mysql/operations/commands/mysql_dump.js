"use strict";

const AttachedCommand = require("../../../../attached_command");


class MysqlDumpOperation extends AttachedCommand {

  constructor(environment, args) {
    super(environment, "mysql", "mysql", []);

    const dbService = environment.get("mysql");
    this.arguments.push(
      "-u " + dbService.config.user,
      "-p" + dbService.config.password,
      environment.config.env_name
   );
  }

}

module.exports = MysqlDumpOperation;
