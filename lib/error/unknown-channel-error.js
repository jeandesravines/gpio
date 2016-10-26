/**
 * Copyright 2016 Jean Desravines <hi@jeandesravines.com>
 */

'use strict';

/**
 * @class
 * @extends Error
 */
class UnknownChannelError extends Error {
	/**
	 * @constructor
	 * @param {string|number} channel
	 */
	constructor(channel) {
		super(`Unknown channel ${channel}`);
	}
}


module.exports = UnknownChannelError;
