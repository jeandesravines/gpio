/**
 * Copyright 2016 Jean Desravines <hi@jeandesravines.com>
 */

'use strict';

const Freezer = require('./freezer');

/**
 * Class used to clean require.cache and process.env
 * @class Cleaner
 */
class Cleaner {
  /**
   * Clean require.cache
   * @static
   */
  static clean() {
    Object.assign(process.env, Cleaner.defaultEnv);
    Object.keys(process.env).forEach((key) => {
      if (Cleaner.defaultEnv.hasOwnProperty(key) === false) {
        Reflect.deleteProperty(process.env, key);
      }
    });

    Cleaner.registered.forEach((key) => {
      Reflect.deleteProperty(require.cache, key);
    });
  }

  /**
   * Register modules
   * @param {Array.<string>} names the modules to register
   * @static
   */
  static register(names) {
    names.forEach((name) => {
      const resolved = require.resolve(name);

      if (Cleaner.registered.includes(resolved) === false) {
        Cleaner.registered.push(resolved);
      }
    });
  }
}

/**
 * require.cache's keys at the initialization
 * @type {Array.<string>}
 * @readonly
 */
Cleaner.defaultKeys = Object.keys(require.cache);

/**
 * process.env's keys at the initialization
 * @type {Object.<string,string>}
 * @readonly
 */
Cleaner.defaultEnv = Freezer.freeze(process.env);

/**
 * Local registered modules
 * @type {Array.<string>}
 * @readonly
 */
Cleaner.registered = [];


module.exports = Cleaner;
