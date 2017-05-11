"use strict";

const Service = require("../../service_base");

/**
 * @id postfix
 * @group mail
 * @label PostFix
 */
module.exports = class PostfixService extends Service {

  /**
   * @inheritdoc
   */
  _composeDocker() {
    let compose = {
      image: "tozd/postfix",
      volumes: [
        `./data/postfix/spool/:/var/spool/postfix`
      ],
      environment: [
        `MAILNAME=${this.env.config.host_alias}`,
        'MY_NETWORKS=192.168.0.0/16 172.0.0.0/8 127.0.0.0/8'
      ]
    };

    return compose;
  }

};