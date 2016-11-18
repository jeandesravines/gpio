/**
 * Copyright 2016 Jean Desravines <hi@jeandesravines.com>
 */

'use strict';

/**
 * @class UnknownDirectionError
 * @extends Error
 */
class UnknownDirectionError extends Error {
  /**
   * @constructor
   * @param {string} direction
   */
  constructor(direction) {
    super(`Unknown direction ${direction}`);
  }
}


module.exports = UnknownDirectionError;
