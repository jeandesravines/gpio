/**
 * Copyright 2017 Jean Desravines <hi@jeandesravines.com>
 */

'use strict';

const {afterEach, beforeEach, describe, it} = require('mocha');
const {expect} = require('chai');
const fs = require('fs-extra');
const promisify = require('@jdes/promisify');
const Gpio = require('../../lib/helper/gpio');
const UnknownChannelError = require('../../lib/error/unknown-channel-error');
const UnknownEdgeError = require('../../lib/error/unknown-edge-error');
const UnknownDirectionError = require('../../lib/error/unknown-direction-error');

describe('Gpio', () => {
  /**
   * @readonly
   * @type {string}
   */
  const path = '.gpio.tmp';

  /**
   * @readonly
   * @type {Object.<string, *>}
   */
  const classConfiguration = {
    path: Gpio.path,
    revision: Gpio.revision,
  };

  /**
   * @type {Gpio}
   */
  let gpio;

  /* ******************************************* */

  beforeEach('Assign GPIO\'s path', () => {
    Gpio.path = path;
  });

  beforeEach('Instantiate and open 7th channel to out', () => {
    return promisify(fs.remove)(path)
      .then(() => Promise.all(Object.keys(Gpio.mapping).map((channel) => {
        return promisify(fs.mkdirs)(`${path}/gpio${Gpio.mapping[channel]}`);
      })))
      .then(() => gpio = new Gpio())
      .then(() => gpio.open(7, Gpio.direction.out));
  });

  afterEach('Close', () => {
    return gpio.close(7)
      .then(() => promisify(fs.remove)(path));
  });

  afterEach('Reset class configuration', () => {
    Object.keys(classConfiguration).forEach((key) => {
      Gpio[key] = classConfiguration[key];
    });
  });

  /* ******************************************* */

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
    });
  });

  describe('Config', () => {
    describe('Revision', () => {
      const cpuinfo = `${path}/cpuinfo`;

      beforeEach('Create the file', () => {
        return promisify(fs.writeFile)(cpuinfo, 'Revision   : 000d');
      });

      it('should returns 2', () => {
        expect(Gpio.getRevision(cpuinfo)).to.be.equal(2);
      });

      it('should returns 3 with a wrong path', () => {
        expect(Gpio.getRevision('directory/unknown')).to.be.equal(3);
      });

      it('should return the default mapping', () => {
        expect(Gpio.getMapping()).to.be.an('object');
      });

      it('should returns 3 with a correct path and an incorrect file', () => {
        return promisify(fs.writeFile)(cpuinfo, '')
          .then(() => {
            expect(Gpio.getRevision(cpuinfo)).to.be.equal(3);
          });
      });
    });

    describe('Pin Mapping', () => {
      it('should do not have duplicate', () => {
        const revisions = Object.keys(Gpio.mappings);
        const result = {};

        for (let i = 0, has = false; i < revisions && false === has; i++) {
          const values = [];
          const mapping = Gpio.mappings[i];
          const keys = Object.keys(Object.assign(result, mapping));

          expect(has = keys.some((key, index) => {
            return values.splice(index, 0, key).indexOf(key) < index;
          })).to.be.equal(false);
        }
      });

      it('should only have keys € [0;40]', () => {
        Object.keys(Gpio.mappings).forEach((revision) => {
          Object.keys(Gpio.mappings[revision]).forEach((key) => {
            expect(Number.parseInt(key, 10)).to.be.within(0, 40);
          });
        });
      });

      it('should only have values € [0;27]', () => {
        Object.keys(Gpio.mappings).forEach((revision) => {
          Object.keys(Gpio.mappings[revision]).forEach((key) => {
            expect(Gpio.mappings[revision][key]).to.be.within(0, 27);
          });
        });
      });

      it('should throw an error if get a pin on a unknown channel', () => {
        expect(() => Gpio.pins[30]).to.throw(UnknownChannelError);
      });

      it('should have the channel', () => {
        expect(Gpio.hasChannel(5)).to.be.equal(true);
      });

      it('should not have the channel', () => {
        expect(Gpio.hasChannel(-1)).to.be.equal(false);
      });
    });

    describe('Open', () => {
      it('should open a channel', () => {
        return gpio.open(7, Gpio.direction.out);
      });

      it('should throw an error with an unknown channel', () => {
        expect(() => gpio.open(30, Gpio.direction.in)).to.throw(UnknownChannelError);
      });

      it('should be open on channel 7', () => {
        return gpio.getValue(7)
          .then((value) => {
            expect(value).to.satisfy(Number.isInteger);
          });
      });
    });

    describe('Exit', () => {
      it('should close all', () => {
        return gpio.closeAll();
      });
    });
  });

  describe('Edit', () => {
    describe('Direction', () => {
      it('should throw an error', () => {
        gpio.setDirection(7, 'unknown')
          .then(() => Promise.reject())
          .catch((error) => {
            expect(error).to.be.an.instanceof(UnknownDirectionError);
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
            expect(error).to.be.an.instanceof(UnknownEdgeError);
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

    describe('Paths', () => {
      expect(Gpio.paths[0]).to.be.equal('/sys/devices/virtual/gpio');
      expect(Gpio.paths[1]).to.be.equal('/sys/class/gpio');
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
        return gpio.setAnalogValue(7, Gpio.signal.low);
      });

      it('set value to high signal', () => {
        return gpio.setAnalogValue(7, Gpio.signal.high);
      });

      it('set value to ~0.5', () => {
        return gpio.setAnalogValue(7, 0.5)
          .then(() => gpio.getAnalogValue(7, 200))
          .then((value) => {
            expect(value).to.be.closeTo(0.5, 0.1);
          });
      });
    });
  });
});
