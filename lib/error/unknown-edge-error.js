'use strict';

/**
 * Copyright 2016 Jean Desravines <hi@jeandesravines.com>
 */

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
		super(`Unknown edge ${edge}`);
	}
}

////////////////////////////////////////////////////
////////////////////////////////////////////////////

module.exports = UnknownEdgeError;