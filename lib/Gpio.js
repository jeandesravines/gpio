'use strict';

/**
 * Copyright 2016 Jean
 */

const fs = require('fs');
const path = require('path');
let singletons = {};

/**
 *
 */
class Gpio {
	/**
	 * Instantiate an Gpio
	 */
	constructor() {
		/**
		 * The intervals for PWM setValue switch on cycles
		 * @private
		 * @type {Object.<number,number>}
		 */
		this._intervals = {};

		/**
		 * The timeouts for PWM setValue switch off cycle
		 * @private
		 * @type {Object.<number,number>}
		 */
		this._timeouts = {};

		/**
		 * The intervals for PWM reads
		 * @private
		 * @type {Object.<number,number>}
		 */
		this._readIntervals = {};

		/**
		 * The timeouts for PWM getValue
		 * @private
		 * @type {Object.<number,number>}
		 */
		this._readTimeouts = {};

		/**
		 * The frequencies for the PWM channel
		 * @private
		 * @type {Object.<number,number>}
		 */
		this._frequencies = {};

		/**
		 * The pin mapping
		 * @readonly
		 * @type {Object.<number,number>}
		 */
		this.pins = new Proxy({}, {
			get: (proxy, channel) => {
				return Gpio.mapping[String(channel)] || (() => {
						throw new Error(`Unknown io channel n°${channel}`);
					})();
			}
		});
	}

	/**
	 *
	 * @param {number} channel
	 * @param {string} direction
	 * @returns {Promise}
	 */
	open(channel, direction) {
		return new Promise((resolve, reject) => {
			this.writeFile('export', this.pins[channel])
				.catch(reject)
				.then(() => {
					this.setDirection(channel, direction)
						.then(resolve)
						.catch(reject);
				});
		});
	}

	/**
	 *
	 * @param {number} channel
	 * @returns {Promise}
	 */
	close(channel) {
		this.clearWriteTimeout(channel);
		this.setValue(channel, Gpio.signal.low);

		return this.writeFile('unexport', this.pins[channel]);
	}

	/**
	 * @private
	 * @param {number} channel
	 */
	clearWriteTimeout(channel) {
		clearInterval(this._intervals[channel]);
		clearTimeout(this._timeouts[channel]);
	}

	/**
	 * @private
	 * @param {number} channel
	 */
	clearReadTimeout(channel) {
		clearInterval(this._readIntervals[channel]);
		clearTimeout(this._readTimeouts[channel]);
	}

	/**
	 *
	 * @param {number} channel
	 * @returns {Promise}
	 */
	getEdge(channel) {
		return this.readFile(this.pins[channel] + '/edge');
	}

	/**
	 *
	 * @param {number} channel
	 * @param {string} edge
	 * @returns {Promise}
	 */
	setEdge(channel, edge) {
		if (false === Gpio.edge.hasOwnProperty(edge)) {
			throw new Error('Unknown edge');
		}

		return this.writeFile(this.pins[channel] + '/edge', edge);
	}

	/**
	 *
	 * @param {number} channel
	 * @returns {Promise}
	 */
	getDirection(channel) {
		return this.readFile(this.pins[channel] + '/direction');
	}

	/**
	 *
	 * @param {number} channel
	 * @param {string} direction
	 * @returns {Promise}
	 */
	setDirection(channel, direction) {
		if (false === Gpio.direction.hasOwnProperty(direction)) {
			throw new Error('Unknown direction');
		}

		return this.writeFile(this.pins[channel] + '/direction', direction);
	}

	/**
	 *
	 * @param {number} channel
	 * @returns {Promise}
	 */
	getValue(channel) {
		return this.readFile(this.pins[channel] + '/value')
			.then(parseInt);
	}

	/**
	 *
	 * @param {number} channel
	 * @param {number} value
	 * @param {boolean} pwm
	 * @returns {Promise}
	 */
	setValue(channel, value, pwm = false) {
		const signal = value ? Gpio.signal.high : Gpio.signal.low;

		if (false === pwm) {
			this.clearWriteTimeout(channel);
			delete this._frequencies[channel];
		}

		return this.writeFile(this.pins[channel] + '/value', signal);
	}

	/**
	 *
	 * @private
	 * @param {string} path
	 * @returns {Promise}
	 */
	readFile(path) {
		return new Promise((resolve, reject) => {
			fs.readFile(Gpio.path + '/' + path, 'utf8', (err, data) => {
				if (err) {
					reject(err);
				} else {
					resolve(data.toString().trim());
				}
			});
		});
	}

	/**
	 *
	 * @private
	 * @param {string} path
	 * @param {string|number} data
	 * @returns {Promise}
	 */
	writeFile(path, data) {
		return new Promise((resolve, reject) => {
			fs.writeFile(Gpio.path + '/' + path, data, 'utf8', (err) => {
				if (err) {
					reject(err);
				} else {
					resolve();
				}
			});
		});
	}

	/**
	 * Read an analog value (float) from the channel
	 * @param {number} channel the channel index
	 * @param {number} duration the duration of computing
	 * @returns {Promise}
	 */
	getAnalogValue(channel, duration = 500) {
		this.clearReadTimeout(channel);

		return new Promise((resolve, reject) => {
			const frame = 1;
			let signal = 0;
			let values = [];

			/* Get the current value in a interval */
			this._readIntervals[channel] = setInterval(() => {
				this.getValue(channel)
					.then((value) => {
						values.push({
							time: Date.now(),
							signal: signal = Number.isInteger(value) ? value : signal
						});
					})
					.catch(reject);
			}, frame);

			/* Compute the result and Resolve promise after the duration */
			this._readTimeouts[channel] = setTimeout(() => {
				let signals = {
					high: 0,
					low: 0
				};

				this.clearReadTimeout(channel);

				values.sort((a, b) => {
					return a.time - b.time;
				}).forEach((value, index) => {
					signals[value.signal ? 'high' : 'low'] += value.time - values[index ? index - 1 : frame].time
				});

				resolve(signals.high / (signals.high + signals.low));
			}, duration);
		});
	}

	/**
	 * Write an analog value (float) in the channel
	 * @param {number} channel the channel index
	 * @param {number} value the analog value
	 * @param {number} frequency the frequency of refresh
	 * @returns {Promise}
	 */
	setAnalogValue(channel, value, frequency) {
		this.clearWriteTimeout(channel);

		return new Promise((resolve, reject) => {
			if (Number.isInteger(value)) {
				this.setValue(channel, value)
					.then(resolve)
					.catch(reject);

			} else {
				const frame = parseInt(1000 / frequency);
				const delay = parseInt(frame * value);

				this._frequencies[channel] = frequency;
				this._intervals[channel] = setInterval(() => {
					this._timeouts[channel] = setTimeout(() => {
						this.setValue(channel, Gpio.signal.low, true)
							.then(resolve)
							.catch(reject);
					}, delay);

					this.setValue(channel, Gpio.signal.high, true)
						.then(resolve)
						.catch(reject);
				}, frame);
			}
		});
	}

	/**
	 *
	 * @readonly
	 * @private
	 * @returns {{v1: string, v2: string}}
	 */
	static get paths() {
		return {
			v1: '/sys/devices/virtual/gpio',
			v2: '/sys/class/gpio'
		};
	}

	/**
	 *
	 * @readonly
	 * @private
	 * @returns {string}
	 */
	static get path() {
		return singletons.path || (singletons.path = fs.existsSync(Gpio.paths.v1) ? Gpio.paths.v1 : Gpio.paths.v2);
	}

	/**
	 *
	 * @readonly
	 * @private
	 * @returns {number}
	 */
	static get revision() {
		return singletons.revision || (singletons.revision = fs.exists('/proc/cpuinfo') ? parseInt(fs.readFileSync('/proc/cpuinfo')
				.match(/Revision\s*:\s*\([0-9a-f]+\)/).pop(), 16) : 0);
	}

	/**
	 *
	 * @readonly
	 * @private
	 * @returns {Object.<string,number>}
	 */
	static get mapping() {
		return singletons.mapping || (singletons.mapping = Object.assign({
				'7': 4,
				'8': 14,
				'10': 15,
				'11': 17,
				'12': 18,
				'15': 22,
				'16': 23,
				'18': 24,
				'19': 10,
				'21': 9,
				'22': 25,
				'23': 11,
				'24': 8,
				'26': 7,
				'29': 5,
				'31': 6,
				'32': 12,
				'33': 13,
				'35': 19,
				'36': 16,
				'37': 26,
				'38': 20,
				'40': 21
			}, Gpio.revision < 4 ? {
				'3': 2,
				'5': 3,
				'13': 27
			} : {
				'3': 0,
				'5': 1,
				'13': 21
			}));
	}

	/**
	 *
	 * @readonly
	 * @returns {{in: string, out: string}}
	 */
	static get direction() {
		return {
			in: 'in',
			out: 'out'
		};
	}

	/**
	 *
	 * @readonly
	 * @returns {{none: string, rising: string, falling: string, both: string}}
	 */
	static get edge() {
		return {
			none: 'none',
			rising: 'rising',
			falling: 'falling',
			both: 'both'
		};
	}

	/**
	 *
	 * @readonly
	 * @returns {{high: number, low: number}}
	 */
	static get signal() {
		return {
			high: 1,
			low: 0
		};
	}
}


////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////

module.exports = Gpio;