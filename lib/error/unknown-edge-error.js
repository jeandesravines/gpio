/**
 * Copyright 2017 Jean Desravines <hi@jeandesravines.com>
 */

'use strict';

/**
 * @class UnknownEdgeError
 * @extends Error
 */
class UnknownEdgeError extends Error {
  /**
   * @constructor
   * @param {string} edge
   */
  constructor(edge) {
    super(`Unknown edge: ${edge}`);
  }
}


module.exports = UnknownEdgeError;
