/**
 * Copyright 2016 Jean Desravines <hi@jeandesravines.com>
 */

'use strict';

const {afterEach, beforeEach, describe, it} = require('mocha');
const {expect, should} = require('chai');
const fs = require('fs');
const promisify = require('@jdes/promisify');
const rimraf = require('rimraf');
const Gpio = require('../../lib/helper/gpio');
const UnknownChannelError = require('../../lib/error/unknown-channel-error');
const UnknownEdgeError = require('../../lib/error/unknown-edge-error');
const UnknownDirectionError = require('../../lib/error/unknown-direction-error');

describe('Gpio', () => {
	/**
	 * @type {Gpio}
	 */
	let gpio;

	/**
	 * @readonly
	 * @type {string}
	 */
	const path = '.gpio.tmp';

	/**
	 * @readonly
	 * @type {Object.<string, *>}
	 */
	let config = {
		path: Gpio.path
	};


	/* Hooks */

	beforeEach(() => {
		Gpio.path = path;
	});

	beforeEach('Instantiate and open 7th channel to out', () => {
		return promisify(rimraf)(path, {})
			.then(() => promisify(fs.mkdir)(path))
			.then(() => Promise.all(Object.keys(Gpio.mapping).map((channel) => {
				return promisify(fs.mkdir)(path + '/' + Gpio.mapping[channel])
			})))
			.then(() => gpio = new Gpio())
			.then(() => gpio.open(7, Gpio.direction.out));
	});

	afterEach('Close', () => {
		return gpio.close(7)
			.then(() => promisify(rimraf)(path, {}));
	});

	afterEach(() => {
		Gpio.path = config.path;
	});


	/* Tests */

	describe('FileSystem', () => {
		describe('read', () => {
			it('should reject on read with a wrong path', () => {
				return Gpio.readFile('directory/unknown')
					.then(() => Promise.reject())
					.catch(() => Promise.resolve());
			});
		});

		describe('write', () => {
			it('should reject on write with a wrong path', () => {
				return Gpio.writeFile('directory/unknown', '')
					.then(() => Promise.reject())
					.catch(() => Promise.resolve());
			});
		});

		describe('exists', () => {
			it('should exists', () => {
				expect(Gpio.exists('.')).to.be.equal(true);
			});

			it('should not exists', () => {
				expect(Gpio.exists('.unknown')).to.be.equal(false);
			});
		})
	});

	describe('Config', () => {
		describe('Revision', () => {
			const cpuinfo = path + '/cpuinfo';

			beforeEach('Create the file', () => {
				return promisify(fs.writeFile)(cpuinfo, 'Revision   : 000f');
			});

			it('should returns 15', () => {
				expect(Gpio.getRevision(cpuinfo)).to.be.equal(15);
			});

			it('should returns 0 with a wrong path', () => {
				expect(Gpio.getRevision('directory/unknown')).to.be.equal(0);
			});
		});

		describe('Pin Mapping', () => {
			it('should throw an error if get a pin on a unknown channel', () => {
				expect(() => Gpio.pins[30]).to.throw(UnknownChannelError);
			});

			it('should return 4', () => {
				expect(Gpio.pins[7]).to.be.equal(4);
			});
		});

		describe('Open', () => {
			it('should open a channel', () => {
				return gpio.open(7, Gpio.direction.out);
			});

			it('should be open on channel 7', () => {
				return gpio.getValue(7)
					.then((value) => {
						expect(value).to.satisfy(Number.isInteger);
					});
			});
		});
	});

	describe('Edit', () => {
		describe('Direction', () => {
			it('should throw an error', () => {
				gpio.setDirection(7, 'unknown')
					.then(() => Promise.reject())
					.catch((error) => {
						expect(error).to.be.a(UnknownDirectionError)
					});
			});

			Object.keys(Gpio.direction).forEach((i) => {
				const value = Gpio.direction[i];

				it(`should set to ${value}`, () => {
					return gpio.setDirection(7, value)
						.then(() => gpio.getDirection(7))
						.then((value) => {
							expect(value).to.be.equal(value);
						});
				});
			});
		});

		describe('Edge', () => {
			it('should throw an error', () => {
				gpio.setEdge(7, 'unknown')
					.then(() => Promise.reject())
					.catch((error) => {
						expect(error).to.be.a(UnknownEdgeError)
					});
			});

			Object.keys(Gpio.edge).forEach((i) => {
				const value = Gpio.edge[i];

				it(`should set to ${value}`, () => {
					return gpio.setEdge(7, value)
						.then(() => gpio.getEdge(7))
						.then((value) => {
							expect(value).to.be.equal(value);
						});
				});
			});
		});

		describe('Path', () => {
			expect(Gpio.paths.v1).to.be.equal('/sys/devices/virtual/gpio');
			expect(Gpio.paths.v2).to.be.equal('/sys/class/gpio');
		});
	});

	describe('IO', () => {
		describe('Digital', () => {
			it('should set to high', () => {
				return gpio.setValue(7, -1)
					.then(() => gpio.getValue(7))
					.then((value) => {
						expect(value).to.be.equal(Gpio.signal.high);
					});
			});

			Object.keys(Gpio.direction).forEach((i) => {
				Object.keys(Gpio.signal).forEach((j) => {
					const direction = Gpio.direction[i];
					const signal = Gpio.signal[j];

					it(`should set to ${signal} to an ${direction} channel`, () => {
						return gpio.setDirection(7, direction)
							.then(() => gpio.setValue(7, signal))
							.then(() => gpio.getValue(7))
							.then((value) => {
								expect(value).to.be.equal(signal);
							});
					});
				});
			});
		});

		describe('Analog', () => {
			it('set value to low signal', () => {
				return gpio.setAnalogValue(7, Gpio.signal.low, 100);
			});

			it('set value to high signal', () => {
				return gpio.setAnalogValue(7, Gpio.signal.high, 100);
			});

			it('set value to ~0.5', () => {
				return gpio.setAnalogValue(7, 0.5, 100)
					.then(() => gpio.getAnalogValue(7, 200))
					.then((value) => {
						expect(value).to.be.closeTo(0.5, 0.1);
					});
			});
		});
	});
});