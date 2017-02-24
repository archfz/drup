"use strict";

const Service = require("../../../../../environment/service_base");
const Command = require("../../../../../system/system_command");

/**
 * @id drush
 * @group misc
 * @label Drush
 */
class DrushService extends Service {

  _composeDocker() {
    return {
      image: "drush/drush",
      volumes_from: [
        this._getWeb().ann("id"),
      ]
    };
  }

  getOperations() {
    return [
      {
        baseName: "drush",
        description: "Run drush inside the container.",
        aliases: ["drush", "dr"],
      }
    ];
  }

  _getWeb() {
    return this._env.services.firstOfGroup("web");
  }

  runOperation(op, args) {
    switch (op) {
      case "drush":
        const drushCmd = `--root=${this._getWeb().getDocumentRoot()} ${args.join(" ")}`;

        return this._env.getContainer("docker")
          .command(drushCmd, ["run", "--rm"], this.ann("id"))
          .catch((err) => {
            console.error(err);
          });
      default:
        return super.runOperation(op, args);
    }
  }

}

module.exports = DrushService;
