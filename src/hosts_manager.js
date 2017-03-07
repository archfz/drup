"use strict";

const HOSTS_BEGIN = "# <drup auto-generated dont-remove>\n";
const HOSTS_END = "# </drup>\n";

const fsp = require("fs-promise");
const os = require("os");

const hostsPath = {
  "aix": "/etc/hosts",
  "darwin": "/etc/hosts",
  "freebsd": "/etc/hosts",
  "linux": "/etc/hosts",
  "openbsd": "/etc/hosts",
  "sunos": "/etc/hosts",
  "win32": "C:/Windows/System32/drivers/etc/hosts",
}[os.platform()];

function getHostsFromContent(content) {
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

function createHostsBackup() {
  return fsp.copy(hostsPath, hostsPath + ".drup.bac");
}

module.exports = {

  isDomainValid(domain) {
    return /^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9](?:\.[a-zA-Z]{2,})+$/.test(domain);
  },

  isIpValid(ip) {
    return /^(\d|[1-9]\d|1\d\d|2([0-4]\d|5[0-5]))\.(\d|[1-9]\d|1\d\d|2([0-4]\d|5[0-5]))\.(\d|[1-9]\d|1\d\d|2([0-4]\d|5[0-5]))\.(\d|[1-9]\d|1\d\d|2([0-4]\d|5[0-5]))$/.test(ip);
  },

  validateDomains(domains) {
    domains.forEach((domain) => {
      if (!this.isDomainValid(domain)) {
        throw new Error("Invalid domain provided: " + domain);
      }
    });
  },

  validateIps(ips) {
    ips.forEach((ip) => {
      if (!this.isIpValid(ip)) {
        throw new Error("Invalid ip provided: " + ip);
      }
    });
  },

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
          .filter((host) => host.indexOf(domain) === -1);
        hosts.push(`${ip}\t${domain}${comment}`);

        return fsp.writeFile(hostsPath, replaceHostsInContent(hosts, content));
      });
  },

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
          .filter((host) => domains.indexOf(host.match(/^[^\s]+/)) !== -1);

        aliases.forEach((alias) => {
          hosts.push(`${alias.ip}\t${alias.domain}${comment}`);
        });

        return fsp.writeFile(hostsPath, replaceHostsInContent(hosts, content));
      });
  },

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