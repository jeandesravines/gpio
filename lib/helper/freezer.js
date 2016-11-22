/**
 * Copyright 2016 Jean Desravines <hi@jeandesravines.com>
 */

'use strict';

/**
 * An helper class used to freeze data
 * @class Freezer
 */
class Freezer {
  /**
   * Deeply freeze an object
   * @param {*} data the data to freeze
   * @return {*} the frozen data
   */
  static freeze(data) {
    if (typeof data !== 'object') {
      return data;
    }

    const frozen = Array.isArray(data) ? [] : {};

    Object.keys(data).forEach((key) => {
      frozen[key] = Freezer.freeze(data[key]);
    });

    return Object.freeze(frozen);
  }
}


module.exports = Freezer;
