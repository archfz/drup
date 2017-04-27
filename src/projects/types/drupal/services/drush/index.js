"use strict";

const Service = require("../../../../../environment/service_base");
const Command = require("../../../../../system/system_command");

/**
 * @Service {
 *  @id "drush",
 *  @group "misc",
 *  @label "Drush",
 * }
 */
class DrushService extends Service {

  /**
   * @inheritdoc
   */
  _composeDocker() {
    return {
      image: "drush/drush",
      volumes_from: [
        this._getWeb().ann("id"),
      ]
    };
  }

  /**
   * @inheritdoc
   */
  getOperations() {
    return [
      {
        baseName: "drush",
        description: "Run drush inside the container.",
        aliases: ["drush", "dr"],
      }
    ];
  }

  /**
   * Gets the web service.
   *
   * @returns {Service}
   *    The web service.
   * @private
   */
  _getWeb() {
    return this._env.services.firstOfGroup("web");
  }

  /**
   * @inheritdoc
   */
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
