'use strict';

const {describe, it} = require('mocha');
const {expect, should} = require('chai');
const Gpio = require('../lib/Gpio');

describe('Gpio', () => {
	/**
	 * @type {Gpio}
	 */
	let gpio = null;

	describe('Create', () => {
		it('create an Gpio', () => {
			expect(gpio = new Gpio()).to.be.instanceOf(Gpio);
		})
	});

	describe('Pin Mapping', () => {

		it('should throw an error if get a pin on a unknown channel', () => {
			expect(() => gpio.pins[30]).to.throw(Error);
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
	});

	describe('Direction', () => {
		it('set to "out"', () => {
			return gpio.setDirection(7, Gpio.direction.out);
		});

		it('should throw an error', () => {
			expect(() => {
				gpio.setDirection(7, 'unknown');
			}).to.throw(Error);
		});

		it('should be set to "out"', () => {
			return gpio.getDirection(7)
				.then((value) => {
					expect(value).to.be.equal(Gpio.direction.out);
				});
		});
	});

	describe('Edge', () => {
		it('set to "none"', () => {
			return gpio.setEdge(7, Gpio.edge.none);
		});

		it('should throw an error', () => {
			expect(() => {
				gpio.setEdge(7, 'unknown');
			}).to.throw(Error);
		});

		it('should be set to "none"', () => {
			return gpio.getEdge(7)
				.then((value) => {
					expect(value).to.be.equal(Gpio.edge.none);
				});
		});
	});

	describe('IO', () => {
		it('set to high signal', () => {
			return gpio.setValue(7, Gpio.signal.high);
		});

		it('should be set to high signal', () => {
			return gpio.getValue(7)
				.then((value) => {
					expect(value).to.be.equal(Gpio.signal.high);
				});
		});

		it('should catch an error on getValue', (done) => {
			gpio.readFile('/dev/unknown')
				.then(() => done(new Error()))
				.catch(() => done());
		});

		it('should catch an error on setValue', (done) => {
			gpio.writeFile('/dev/unknown', '')
				.then(() => done(new Error()))
				.catch(() => done());
		});
	});

	describe('Analog IO', () => {
		it('set value to low signal', () => {
			return gpio.setAnalogValue(7, Gpio.signal.low, 100);
		});

		it('set value to high signal', () => {
			return gpio.setAnalogValue(7, Gpio.signal.high, 100);
		});

		it('set value to ~0.5', () => {
			return gpio.setAnalogValue(7, 0.5, 100);
		});

		it('should be set to 0.5', () => {
			return gpio.getAnalogValue(7)
				.then((value) => {
					expect(value).to.be.within(0.4, 0.6);
				});
		});
	});

	describe('Close', () => {
		it('should close a channel', () => {
			return gpio.close(7);
		});
	});
});