/**
 * Copyright 2016 Jean Desravines <hi@jeandesravines.com>
 */

'use strict';

const fs = require('fs');
const path = require('path');
const configuration = require('../configuration/configuration');
const Catcher = require('@jdes/catcher');
const UnknownChannelError = require('../error/unknown-channel-error');
const UnknownEdgeError = require('../error/unknown-edge-error');
const UnknownDirectionError = require('../error/unknown-direction-error');

/**
 * @class {Gpio}
 */
class Gpio {
	/**
	 * Instantiate a Gpio
	 * @constructor
	 */
	constructor() {
		/**
		 * The intervals for PWM setValue switch on cycles
		 * @private
		 * @type {Object.<number, number>}
		 */
		this._intervals = {};

		/**
		 * The timeouts for PWM setValue switch off cycle
		 * @private
		 * @type {Object.<number, number>}
		 */
		this._timeouts = {};

		/**
		 * The intervals for PWM reads
		 * @private
		 * @type {Object.<number, number>}
		 */
		this._readIntervals = {};

		/**
		 * The timeouts for PWM getValue
		 * @private
		 * @type {Object.<number, number>}
		 */
		this._readTimeouts = {};


		//////////////////////////////////////////
		//////////////////////////////////////////

		process.on('beforeExit', this.closeAll.bind(this));
	}

	/**
	 *
	 * @param {number} channel
	 * @param {string} direction
	 * @returns {Promise}
	 */
	open(channel, direction) {
		return Gpio.writeFile('export', Gpio.pins[channel])
			.then(() => this.setDirection(channel, direction))
			.then(() => this.setValue(channel, Gpio.signal.low));
	}

	/**
	 *
	 * @param {number} channel
	 * @returns {Promise}
	 */
	close(channel) {
		return this.clearWriteTimeout(channel)
			.then(() => this.setValue(channel, Gpio.signal.low))
			.then(() => Gpio.writeFile('unexport', Gpio.pins[channel]));
	}

	/**
	 * Close all channel
	 * @returns {Promise}
	 */
	closeAll() {
		return Promise.all(Object.keys(Gpio.mapping).map((key) => this.close(key)));
	}

	/**
	 * @private
	 * @param {number} channel
	 * @param {string} filename
	 * @returns {string}
	 */
	getChannelPath(channel, filename) {
		return path.join(`gpio${Gpio.pins[channel]}`, filename);
	}

	/**
	 * @private
	 * @param {number} channel
	 * @return {Promise}
	 */
	clearWriteTimeout(channel) {
		return new Promise((resolve) => {
			clearInterval(this._intervals[channel]);
			clearTimeout(this._timeouts[channel]);
			resolve();
		});
	}

	/**
	 * @private
	 * @param {number} channel
	 * @return {Promise}
	 */
	clearReadTimeout(channel) {
		return new Promise((resolve) => {
			clearInterval(this._readIntervals[channel]);
			clearTimeout(this._readTimeouts[channel]);
			resolve();
		});
	}

	/**
	 *
	 * @param {number} channel
	 * @returns {Promise}
	 */
	getEdge(channel) {
		return Gpio.readFile(this.getChannelPath(channel, 'edge'));
	}

	/**
	 *
	 * @param {number} channel
	 * @param {string} edge
	 * @returns {Promise}
	 */
	setEdge(channel, edge) {
		return new Promise((resolve, reject) => {
			if (Gpio.edge.hasOwnProperty(edge) === false) {
				reject(new UnknownEdgeError(edge));
			} else {
				resolve();
			}
		}).then(() => Gpio.writeFile(this.getChannelPath(channel, 'edge'), edge));
	}

	/**
	 *
	 * @param {number} channel
	 * @returns {Promise}
	 */
	getDirection(channel) {
		return Gpio.readFile(this.getChannelPath(channel, 'direction'));
	}

	/**
	 *
	 * @param {number} channel
	 * @param {string} direction
	 * @returns {Promise}
	 */
	setDirection(channel, direction) {
		return new Promise((resolve, reject) => {
			if (Gpio.direction[direction]) {
				resolve();
			} else {
				reject(new UnknownDirectionError(direction));
			}
		}).then(() => {
			return Gpio.writeFile(this.getChannelPath(channel, 'direction'), direction);
		});
	}

	/**
	 *
	 * @param {number} channel
	 * @returns {Promise}
	 */
	getValue(channel) {
		return Gpio.readFile(this.getChannelPath(channel, 'value'))
			.then((value) => parseInt(value, 10));
	}

	/**
	 *
	 * @param {number} channel
	 * @param {number} value
	 * @returns {Promise}
	 */
	setValue(channel, value) {
		const filename = this.getChannelPath(channel, 'value');
		const signal = value ? Gpio.signal.high : Gpio.signal.low;

		return Gpio.writeFile(filename, signal);
	}

	/**
	 * Read an analog value (float) from the channel
	 * @param {number} channel the channel index
	 * @param {number} duration the duration of computing
	 * @returns {Promise}
	 */
	getAnalogValue(channel, duration = 500) {
		return this.clearReadTimeout(channel)
			.then(() => new Promise((resolve, reject) => {
				const values = [];
				let signal = 0;

				/* Get the current value in a interval */
				this._readIntervals[channel] = setInterval(() => {
					this.getValue(channel)
						.then((value) => values.push({
							time: Date.now(),
							signal: signal = Number.isInteger(value) ? value : signal
						}))
						.catch(reject);
				}, Gpio.frame);

				/* Compute the result and Resolve promise after the duration */
				this._readTimeouts[channel] = setTimeout(() => {
					const signals = {
						high: 0,
						low: 0
					};

					this.clearReadTimeout(channel)
						.then(() => {
							values.sort((a, b) => a.time - b.time)
								.forEach((v, i) => {
									signals[v.signal ? 'high' : 'low'] += v.time - values[i ? i - 1 : 0].time
								});

							resolve(signals.high / (signals.high + signals.low));
						});
				}, duration);
			}));
	}

	/**
	 * Write an analog value (float) in the channel
	 * @param {number} channel the channel index
	 * @param {number} value the analog value
	 * @returns {Promise}
	 */
	setAnalogValue(channel, value) {
		return this.clearWriteTimeout(channel)
			.then(() => new Promise((resolve, reject) => {
				if (Number.isInteger(value)) {
					this.clearWriteTimeout(channel)
						.then(() => this.setValue(channel, value))
						.then(resolve)
						.catch(reject);

				} else {
					const frame = parseInt(1000 / Gpio.frequency, 10);
					const delay = parseInt(frame * value, 10);
					let resolved = false;
					const resolveOnce = (data) => {
						if (resolved === false) {
							resolved = true;
							resolve(data);
						}
					};

					this._intervals[channel] = setInterval(() => {
						this._timeouts[channel] = setTimeout(() => {
							this.setValue(channel, Gpio.signal.low)
								.then(resolveOnce)
								.catch(reject);
						}, delay);

						this.setValue(channel, Gpio.signal.high)
							.then(resolveOnce)
							.catch(reject);
					}, frame);
				}
			}));
	}

	/**
	 *
	 * @param {string} filename
	 * @returns {Promise}
	 */
	static readFile(filename) {
		const pathname = path.join(Gpio.path, filename);

		return new Promise((resolve, reject) => {
			fs.readFile(pathname, 'utf8', (error, data) => {
				if (error) {
					reject(error);
				} else {
					resolve(data);
				}
			})
		});
	}

	/**
	 *
	 * @param {string} filename
	 * @param {string|number} data
	 * @returns {Promise}
	 */
	static writeFile(filename, data) {
		const pathname = path.join(Gpio.path, filename);

		return new Promise((resolve, reject) => {
			fs.writeFile(pathname, data, {
				encoding: 'utf8',
				flag: 'w+'
			}, (error, data) => {
				if (error) {
					reject(error);
				} else {
					resolve(data);
				}
			})
		});
	}

	/**
	 * Returns true if the filename exists
	 * @param {string} filename
	 * @return {boolean}
	 */
	static exists(filename) {
		return Catcher.resolve(() => fs.lstatSync(filename)) ? true : false;
	}

	/**
	 * Get the Revision indicated in the file at filename
	 * @param {string} filename the path to search the Revision
	 * @returns {Number} the revision
	 */
	static getRevision(filename = '/proc/cpuinfo') {
		// revision in the file.
		const label = Gpio.exists(filename) ? (fs.readFileSync(filename).toString()
			.match(/Revision\s*:\s*(.+)/) || []).pop() : null;

		// Extract the number of revision by label
		const revision = label ? Number(Object.keys(Gpio.revisions).find((key) => {
			return Gpio.revisions[key].includes(label);
		})) : null;

		return revision || configuration.revision;
	}

	/**
	 * Get the correct mapping for the CPU revision
	 * @param {number} [revision] the CPU revision
	 * @return {Object} the mapping
	 */
	static getMapping(revision) {
		return Object.keys(Gpio.mappings).filter((key) => key <= revision || Gpio.revision)
			.reduce((mapping, key) => {
				return Object.assign(mapping, Gpio.mappings[key]);
			}, {});
	}

	/**
	 * Returns true if the Gpio has a channel
	 * @param {number|string} channel
	 * @returns {boolean}
	 */
	static hasChannel(channel) {
		return Gpio.mapping.hasOwnProperty(String(channel));
	}
}


/**
 * Time in ms for computing analog reads
 * @type {number}
 */
Gpio.frame = configuration.frame;


/**
 * Frequency in Hz for analog writes
 * @type {number}
 */
Gpio.frequency = configuration.frequency;


/**
 * @readonly
 * @private
 * @type {Object.<int, Array.<string>>}
 */
Gpio.revisions = Object.freeze({
	0: ['0011', '0014'],
	1: ['0002', '0003'],
	2: ['0004', '0005', '0006', '0007', '0008', '0009', '000d', '000e', '000f'],
	3: ['0010', '0012', '0013']
});


/**
 * @readonly
 * @type {Object.<int, Object>}
 */
Gpio.mappings = Object.freeze({
	0: {
		3: 2,
		5: 3,
		7: 4,
		8: 14,
		10: 15,
		11: 17,
		12: 18,
		13: 27,
		15: 22,
		16: 23,
		18: 24,
		19: 10,
		21: 9,
		22: 25,
		23: 11,
		24: 8,
		26: 7
	},
	1: {
		3: 0,
		5: 1,
		13: 21
	},
	2: {
		3: 2,
		5: 3,
		13: 27
	},
	3: {
		29: 5,
		31: 6,
		32: 12,
		33: 13,
		35: 19,
		36: 16,
		37: 26,
		38: 20,
		40: 21
	}
});


/**
 * Raspberry Pi revision
 * @readonly
 * @returns {number} the revision number
 */
Gpio.revision = Gpio.getRevision();


/**
 * The mapping Channel -> Pin
 * @readonly
 * @returns {Object.<string, number>}
 */
Gpio.mapping = Gpio.getMapping(Gpio.revision);


/**
 * The pin mapping
 * @readonly
 * @type {Object.<number,number>}
 * @throws UnknownChannelError
 */
Gpio.pins = new Proxy({}, {
	get: (_, channel) => Gpio.mapping[String(channel)] || Catcher.reject(new UnknownChannelError(channel))
});


/**
 * The directions
 * @readonly
 * @returns {{in: string, out: string}}
 */
Gpio.direction = Object.freeze({
	in: 'in',
	out: 'out'
});


/**
 * The edges
 * @readonly
 * @returns {{none: string, rising: string, falling: string, both: string}}
 */
Gpio.edge = Object.freeze({
	none: 'none',
	rising: 'rising',
	falling: 'falling',
	both: 'both'
});


/**
 * The signals
 * @readonly
 * @returns {{high: number, low: number}}
 */
Gpio.signal = Object.freeze({
	high: 1,
	low: 0
});


/**
 * The possible paths to the Gpio
 * @readonly
 * @returns {Array.<string>}
 */
Gpio.paths = Object.freeze([
	'/sys/devices/virtual/gpio',
	'/sys/class/gpio'
]);


/**
 *
 * @type {string}
 * @readonly
 */
Gpio.path = Gpio.exists(Gpio.paths[0]) ? Gpio.paths[0] : Gpio.paths[1];


////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////

module.exports = Gpio;