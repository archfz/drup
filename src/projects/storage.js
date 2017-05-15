"use strict";

const yaml = require($SRC + "yaml");
const path = require("path");
const pathIsInside = require("path-is-inside");
const fs = require("fs-promise");

const globals = require("../globals");

let _storage;

/**
 * Gets the storage.
 *
 * @returns {Promise}
 * @resolve {Object}
 *    The storage object.
 */
function getStorage() {
  if (_storage) {
    return Promise.resolve(_storage);
  }

  // When first saving project the directory might not exist,
  // so first ensure it does.
  return fs.ensureDir(globals.GLOBAL_STORE_ROOT)
    .then(() => yaml.read(ProjectStorage.FULLPATH))
    .catch((err) => {
      // If the store file doesn't exist return empty object.
      if (err.code === "ENOENT") {
        return {};
      }

      throw new Error(`Failed loading in project storage file:\nFILE: ${ProjectStorage.FULLPATH}\n` + err);
    })
    .then((data) => {
      _storage = data;
      return data;
    });
}

/**
 * Project storage handler.
 */
class ProjectStorage {

  /**
   * Gets storage data for project by key.
   *
   * @param {string} key
   *    Project key
   *
   * @returns {Promise}
   * @resolve {Object}
   *    Project storage data.
   */
  static get(key) {
    return getStorage()
      .then((storage) => {
        if (!storage.hasOwnProperty(key)) {
          return null;
        }

        return JSON.parse(JSON.stringify(storage[key]));
      });
  }

  /**
   * Gets all storage data.
   *
   * @returns {Promise}
   * @resolve {Object}
   *    All storage data.
   */
  static getAll() {
    return getStorage()
      .then((storage) => {
        return JSON.parse(JSON.stringify(storage));
      });
  }

  /**
   * Sets storage data for project.
   *
   * @param {string} key
   *    Project key.
   * @param data
   *    Data to save.
   *
   * @returns {Promise}
   */
  static set(key, data) {
    return getStorage()
      .then((storage) => {
        storage[key] = data;

        return yaml.write(ProjectStorage.FULLPATH, storage);
      })
      .catch((err) => {
        throw new Error(`Failed saving project storage when setting '${key}'.` + err);
      });
  }

  /**
   * Removes project data.
   *
   * @param {string} key
   *    Project key.
   *
   * @returns {Promise}
   */
  static remove(key) {
    return getStorage()
      .then((storage) => {
        if (storage.hasOwnProperty(key)) {
          delete storage[key];
          return yaml.write(ProjectStorage.FULLPATH, storage);
        }

        return null;
      })
      .catch((err) => {
        throw new Error(`Failed saving project storage when removing '${key}'.` + err);
      });
  }

  /**
   * Gets project by directory.
   *
   * @param {string} dir
   *    Directory to search for.
   *
   * @returns {Promise}
   */
  static getByDirectory(dir) {
    dir = path.normalize(dir);

    return getStorage()
      .then((storage) => {
        for (const [key, data] of Object.entries(storage)) {
          if (pathIsInside(dir, data.root)) {
            return {
              key: key,
              data: JSON.parse(JSON.stringify(storage[key])),
            };
          }
        }

        return null;
      });
  }

}

ProjectStorage.FILENAME = "projects.yml";
ProjectStorage.FULLPATH = path.join(globals.GLOBAL_STORE_ROOT, ProjectStorage.FILENAME);

module.exports = ProjectStorage;
