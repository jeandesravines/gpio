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
const NotFoundError = require('../../lib/error/not-found-error');
const UnknownChannelError = require('../../lib/error/unknown-channel-error');
const UnknownEdgeError = require('../../lib/error/unknown-edge-error');
const UnknownDirectionError = require('../../lib/error/unknown-direction-error');

describe('Gpio', () => {
	/**
	 * @type {Gpio}
	 */
	let gpio;

	/**
	 *
	 * @type {string}
	 */
	const path = '.gpio.tmp';


	/* Hooks */

	beforeEach('Instantiate and open 7th channel to out', () => {
		return promisify(rimraf)(path, {})
			.then(() => promisify(fs.mkdir)(path))
			.then(() => Promise.all(Object.keys(Gpio.mapping).map((channel) => {
				return promisify(fs.mkdir)(path + '/' + Gpio.mapping[channel])
			})))
			.then(() => {
				return (gpio = new Gpio(path)).open(7, Gpio.direction.out);
			});
	});

	afterEach('Close', () => {
		return gpio.close(7)
			.then(() => promisify(rimraf)(path, {}));
	});


	/* Tests */

	describe('FileSystem', () => {
		describe('read', () => {
			it('should reject on read with a wrong path', () => {
				return gpio.readFile('directory/unknown')
					.then(() => Promise.reject())
					.catch(() => Promise.resolve());
			});
		});

		describe('write', () => {
			it('should reject on write with a wrong path', () => {
				return gpio.writeFile('directory/unknown', '')
					.then(() => Promise.reject())
					.catch(() => Promise.resolve());
			});
		});

		describe('exists', () => {
			it('should exists', () => {
				expect(Gpio.exists('.')).to.be.equal(true);
			});
		})
	});

	describe('Config', () => {
		describe('Instantiate', () => {
			it('should create or throw an error', () => {
				try {
					expect(new Gpio()).to.be.instanceOf(Gpio);
				} catch (e) {
					expect(e).to.be.instanceOf(NotFoundError);
				}
			});
		});

		describe('Pin Mapping', () => {
			it('should throw an error if get a pin on a unknown channel', () => {
				expect(() => gpio.pins[30]).to.throw(UnknownChannelError);
			});

			it('should return 4', () => {
				expect(gpio.pins[7]).to.be.equal(4);
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

			it('should catch an error on open with a wrong path', () => {
				expect(() => {
					const _ = new Gpio('/dev/null/unknown');
				}).to.throw(NotFoundError);
			});
		});
	});

	describe('Edit', () => {
		describe('Direction', () => {
			it('should throw an error', () => {
				expect(() => {
					gpio.setDirection(7, 'unknown');
				}).to.throw(UnknownDirectionError);
			});

			for (let i in Gpio.direction) {
				const value = Gpio.direction[i];

				it(`should set to ${value}`, () => {
					return gpio.setDirection(7, value)
						.then(() => gpio.getDirection(7))
						.then((value) => {
							expect(value).to.be.equal(value);
						});
				});
			}
		});

		describe('Edge', () => {
			it('should throw an error', () => {
				expect(() => {
					gpio.setEdge(7, 'unknown');
				}).to.throw(UnknownEdgeError);
			});

			for (let i in Gpio.edge) {
				const value = Gpio.edge[i];

				it(`should set to ${value}`, () => {
					return gpio.setEdge(7, value)
						.then(() => gpio.getEdge(7))
						.then((value) => {
							expect(value).to.be.equal(value);
						});
				});
			}
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

			for (let i in Gpio.direction) {
				const direction = Gpio.direction[i];

				for (let j in Gpio.signal) {
					const signal = Gpio.signal[j];

					it(`should set to ${signal} to an ${direction} channel`, () => {
						return gpio.setDirection(7, direction)
							.then(() => gpio.setValue(7, signal))
							.then(() => gpio.getValue(7))
							.then((value) => {
								expect(value).to.be.equal(signal);
							});
					});
				}
			}
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
						expect(value).to.be.within(0.4, 0.6);
					});
			});
		});
	});
});