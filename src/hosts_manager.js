"use strict";

const HOSTS_BEGIN = "# <drup auto-generated dont-remove>\n";
const HOSTS_END = "# </drup>\n";

const fsp = require("fs-promise");
const os = require("os");

/**
 * Path to the hosts file.
 */
const hostsPath = {
  "aix": "/etc/hosts",
  "darwin": "/etc/hosts",
  "freebsd": "/etc/hosts",
  "linux": "/etc/hosts",
  "openbsd": "/etc/hosts",
  "sunos": "/etc/hosts",
  "win32": "C:/Windows/System32/drivers/etc/hosts",
}[os.platform()];

/**
 * Gets host aliases from content managed by this module.
 *
 * @param {string} content
 *    The hosts file content.
 *
 * @returns {Array}
 *    Host alias lines.
 */
function getHostsFromContent(content) {
  // Read only the ones managed by us.
  let begin = content.indexOf(HOSTS_BEGIN);

  if (begin === -1) {
    return [];
  }

  content = content.substr(begin + HOSTS_BEGIN.length);

  let end = content.indexOf(HOSTS_END);
  if (end === -1) {
    throw Error("Malformed hosts file.");
  }

  content = content.substr(0, end - 1);

  return content.split("\n");
}

/**
 * Sets hosts in content.
 *
 * @param {Array} hosts
 *    Hosts lines.
 * @param {string} content
 *    Content to replace in.
 *
 * @returns {string}
 *    Content with replaced/set hosts.
 */
function replaceHostsInContent(hosts, content) {
  let begin = content.indexOf(HOSTS_BEGIN);
  let upper = "";
  let lower = "";

  if (begin === -1) {
    upper = content + "\n\n" + HOSTS_BEGIN;
    lower = "\n" + HOSTS_END;
  }
  else {
    upper = content.substr(0, begin + HOSTS_BEGIN.length);
    lower = "\n" + content.substr(content.indexOf(HOSTS_END));
  }

  return upper + hosts.join("\n") + lower;
}

/**
 * Creates backup of the hosts file.
 *
 * @returns {Promise}
 */
function createHostsBackup() {
  return fsp.copy(hostsPath, hostsPath + ".drup.bac");
}

module.exports = {

  /**
   * Checks if the domain is valid.
   *
   * @param {string} domain
   *    Domain name.
   *
   * @returns {boolean}
   */
  isDomainValid(domain) {
    return /^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9](?:\.[a-zA-Z]{2,})+$/.test(domain);
  },

  /**
   * Checks if IP is valid.
   *
   * @param {string} ip
   *    The IP address.
   *
   * @returns {boolean}
   */
  isIpValid(ip) {
    return /^(\d|[1-9]\d|1\d\d|2([0-4]\d|5[0-5]))\.(\d|[1-9]\d|1\d\d|2([0-4]\d|5[0-5]))\.(\d|[1-9]\d|1\d\d|2([0-4]\d|5[0-5]))\.(\d|[1-9]\d|1\d\d|2([0-4]\d|5[0-5]))$/.test(ip);
  },

  /**
   * Throws on invalid domains.
   *
   * @param {string[]} domains
   *    Array of domain names.
   */
  validateDomains(domains) {
    domains.forEach((domain) => {
      if (!this.isDomainValid(domain)) {
        throw new Error("Invalid domain provided: " + domain);
      }
    });
  },

  /**
   * Throws on invalid IPs.
   *
   * @param {string[]} ips
   *    Array of IPs.
   */
  validateIps(ips) {
    ips.forEach((ip) => {
      if (!this.isIpValid(ip)) {
        throw new Error("Invalid ip provided: " + ip);
      }
    });
  },

  /**
   * Adds hosts alias to the hosts file.
   *
   * @param {string} domain
   *    The domain name.
   * @param {string} ip
   *    The IP address.
   * @param {string} comment
   *    Comment for the alias.
   *
   * @returns {Promise}
   */
  addHost(domain, ip, comment = "") {
    this.validateDomains([domain]);
    this.validateIps([ip]);

    if (comment !== "") {
      comment = "\t\t#" + comment;
    }

    return createHostsBackup().then(() => {
        return fsp.readFile(hostsPath);
      })
      .then((content) => {
        if (typeof content === "object") {
          content = content.toString();
        }

        let hosts = getHostsFromContent(content)
        // Filter out duplicates.
          .filter((host) => host.indexOf(domain) === -1);
        hosts.push(`${ip}\t${domain}${comment}`);

        return fsp.writeFile(hostsPath, replaceHostsInContent(hosts, content));
      });
  },

  /**
   * Adds multiple hosts aliases to the hosts file.
   *
   * @param {Object[]} aliases
   *    Alias objects with: ip and domain keys.
   * @param comment
   *
   * @returns {Promise}
   */
  addHosts(aliases, comment = "") {
    const domains = aliases.map((alias) => alias.domain);
    this.validateDomains(domains);
    this.validateIps(aliases.map((alias) => alias.ip));

    if (comment !== "") {
      comment = "\t\t#" + comment;
    }

    return createHostsBackup().then(() => {
        return fsp.readFile(hostsPath);
      })
      .then((content) => {
        if (typeof content === "object") {
          content = content.toString();
        }

        let hosts = getHostsFromContent(content)
        // Filter out duplicates.
          .filter((host) => domains.indexOf(host.match(/^[^\s]+/)) !== -1);

        aliases.forEach((alias) => {
          hosts.push(`${alias.ip}\t${alias.domain}${comment}`);
        });

        return fsp.writeFile(hostsPath, replaceHostsInContent(hosts, content));
      });
  },

  /**
   * Remove hosts alias from hosts file.
   *
   * @param {string} domain
   *    The domain name to remove.
   *
   * @returns {Promise}
   */
  removeHost(domain) {
    return createHostsBackup().then(() => {
        return fsp.readFile(hostsPath);
      })
      .then((content) => {
        if (typeof content === "object") {
          content = content.toString();
        }

        let hosts = getHostsFromContent(content);

        hosts.filter((host) => host.indexOf(domain) === -1);

        return fsp.writeFile(hostsPath, replaceHostsInContent(hosts, content));
      });
  },

};