/**
 * Copyright 2016 Jean Desravines <hi@jeandesravines.com>
 */

'use strict';

/**
 * @class NotFoundError
 * @extends Error
 */
class NotFoundError extends Error {
	/**
	 * @constructor
	 * @param {string} path
	 */
	constructor(path) {
		super(`Path not found "${path}"`);
	}
}

/////////////////////////////////////////////////////
/////////////////////////////////////////////////////

module.exports = NotFoundError;