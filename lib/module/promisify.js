/**
 * Copyright 2016 Jean Desravines <hi@jeandesravines.com>
 */

'use strict';

/**
 *
 * @param {Function} handler
 * @returns {function(...[*]): Promise}
 */
function promisify(handler) {
	return (...args) => new Promise((resolve, reject) => {
		handler.call(handler, ...args.concat((error, ...data) => {
			error ? reject(error) : resolve.call(this, ...data);
		}));
	});
}

////////////////////////////////////////////////////
////////////////////////////////////////////////////

module.exports = promisify;