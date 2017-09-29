"use strict";

const Service = require("../../service_base");

/**
 * @Service {
 *  @id "postfix",
 *  @group "mail",
 *  @label "PostFix",
 * }
 */
module.exports = class PostfixService extends Service {

  /**
   * @inheritdoc
   */
  _composeDocker() {
    return {
      image: "tozd/postfix",
      environment: [
        `MAILNAME=${this.env.config.host_aliases[0]}`,
        'MY_NETWORKS=192.168.0.0/16 172.0.0.0/8 127.0.0.0/8'
      ]
    };
  }

  /**
   * @inheritDoc
   */
  getVolumes() {
    return super.getVolumes([{
      host: `./data/postfix/spool/`,
      container: `/var/spool/postfix`,
    }]);
  }

};