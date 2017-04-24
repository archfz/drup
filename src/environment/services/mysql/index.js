"use strict";

const inquirer = require("inquirer");
const os = require("os");

const Service = require("../../service_base");

/**
 * @id mysql
 * @group database
 * @label MySQL
 * @priority 15
 * @aliased
 */
module.exports = class MysqlService extends Service {

  /**
   * @inheritdoc
   */
  static defineConfiguration() {
    return {
      user: {
        label: "User",
        default: "admin",
      },
      password: {
        label: "Password",
        default: "admin",
      },
    };
  }

  /**
   * @inheritdoc
   */
  bindEnvironment(env) {
    super.bindEnvironment(env);

    if (env.services.has("php")) {
      env.services.get("php").addExtensions(["pdo_mysql"]);
    }
  }

  /**
   * @inheritdoc
   */
  _configure() {
    return inquirer.prompt([{
      type: "input",
      name: "user",
      message: "MySQL user:",
      default: this.config.user,
    }, {
      type: "password",
      name: "password",
      message: "MySQL password:",
      default: this.config.password,
    }]).then((values) => {
      this.config.user = values.user;
      this.config.password = values.password;
    });
  }

  /**
   * @inheritdoc
   */
  _composeDocker() {
    let compose = {
      image: "mysql/mysql-server:5.7",
      environment: {
        MYSQL_RANDOM_ROOT_PASSWORD: 1,
        MYSQL_DATABASE: this.env.config.env_name,
        MYSQL_USER: this.config.user,
        MYSQL_PASSWORD: this.config.password,
      },
    };

    return compose;
  }

  /**
   * @inheritdoc
   */
  getVolumes() {
    let volumes = [];

    // Workaround for windows as mysql won't be able to read from the volume
    // and container won't start. Let docker create volume manually.
    if (os.platform() === "win32") {
      volumes.push({container: `/var/lib/mysql`});
    }
    else {
      volumes.push({
        host: `./data/${this.ann("id")}`,
        container: "/var/lib/mysql",
      });
    }

    return super.getVolumes(volumes);
  }

  printInformation() {
    super.printInformation();

    console.log("- Database name: \"" + this.env.config.env_name + "\"");
  }

};