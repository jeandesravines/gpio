/**
 * Copyright 2016 Jean Desravines <hi@jeandesravines.com>
 */

'use strict';

const fs = require('fs');
const path = require('path');
const {EventEmitter} = require('events');
const configuration = require('../configuration/configuration');
const Catcher = require('@jdes/catcher');
const UnknownChannelError = require('../error/unknown-channel-error');
const UnknownEdgeError = require('../error/unknown-edge-error');
const UnknownDirectionError = require('../error/unknown-direction-error');

/**
 * @class Gpio
 * @extends EventEmitter
 */
class Gpio extends EventEmitter {
  /**
   * Instantiate a Gpio
   * @constructor
   */
  constructor() {
    super();

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

    /* ********************************** */

    process.on('beforeExit', this.closeAll.bind(this));
  }

  /**
   * Open a channel
   * @param {number} channel
   * @param {string} direction
   * @return {Promise} a resolved Promise if the channel has been opened
   */
  open(channel, direction) {
    return Gpio.writeFile('export', Gpio.pins[channel])
      .then(() => this.setDirection(channel, direction))
      .then(() => this.setValue(channel, Gpio.signal.low));
  }

  /**
   * Close a channel
   * @param {number} channel
   * @return {Promise} a resolved Promise if the channel has been closed
   */
  close(channel) {
    return this.clearWriteTimeout(channel)
      .then(() => this.setValue(channel, Gpio.signal.low))
      .then(() => Gpio.writeFile('unexport', Gpio.pins[channel]));
  }

  /**
   * Close all channel
   * @return {Promise} a resolved Promise if all channels has been closed
   */
  closeAll() {
    return Promise.all(Object.keys(Gpio.mapping).map((key) => {
      return this.close(key);
    }));
  }

  /**
   * @private
   * @param {number} channel
   * @param {string} filename
   * @return {string} the path to the channel
   */
  getChannelPath(channel, filename) {
    return path.join(`gpio${Gpio.pins[channel]}`, filename);
  }

  /**
   * @private
   * @param {number} channel
   * @return {Promise} a self-resolved Promise
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
   * @return {Promise} a self-resolved Promise
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
   * @return {Promise<string>} a resolved Promise containing the channel's edge
   */
  getEdge(channel) {
    return this.readChannel(channel, 'edge');
  }

  /**
   *
   * @param {number} channel
   * @param {string} edge
   * @return {Promise} a resolved Promise if the channel's edge hs been set
   */
  setEdge(channel, edge) {
    return new Promise((resolve, reject) => {
      if (Gpio.edge.hasOwnProperty(edge) === false) {
        reject(new UnknownEdgeError(edge));
      } else {
        resolve();
      }
    }).then(() => this.writeChannel(channel, 'edge', edge));
  }

  /**
   *
   * @param {number} channel
   * @return {Promise<string>} a resolved Promise containing the channel's
   *     direction
   */
  getDirection(channel) {
    return this.readChannel(channel, 'direction');
  }

  /**
   *
   * @param {number} channel
   * @param {string} direction
   * @return {Promise} resolved Promise if the channel's direction has been set
   */
  setDirection(channel, direction) {
    return new Promise((resolve, reject) => {
      if (Gpio.direction[direction]) {
        resolve();
      } else {
        reject(new UnknownDirectionError(direction));
      }
    }).then(() => {
      return this.writeChannel(channel, 'direction', direction);
    });
  }

  /**
   *
   * @param {number} channel
   * @return {Promise<string>} a resolved Promise containing the channel's value
   */
  getValue(channel) {
    return this.readChannel(channel, 'value')
      .then((value) => parseInt(value, 10));
  }

  /**
   *
   * @param {number} channel
   * @param {number} value
   * @return {Promise} resolved Promise if the channel's value has been set
   */
  setValue(channel, value) {
    const signal = value ? Gpio.signal.high : Gpio.signal.low;

    return this.writeChannel(channel, 'value', signal);
  }

  /**
   * Read an analog value (float) from the channel
   * @param {number} channel the channel index
   * @param {number} duration the duration of computing
   * @return {Promise} a resolved Promise when the value has been computed
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
              signal: signal = Number.isInteger(value) ? value : signal,
            }))
            .catch(reject);
        }, Gpio.frame);

        /* Compute the result and Resolve promise after the duration */
        this._readTimeouts[channel] = setTimeout(() => {
          const signals = {
            high: 0,
            low: 0,
          };

          this.clearReadTimeout(channel)
            .then(() => {
              values.sort((a, b) => a.time - b.time)
                .forEach((v, i) => {
                  const key = v.signal ? 'high' : 'low';
                  const value = v.time - values[i ? i - 1 : 0].time;

                  signals[key] += value;
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
   * @return {Promise} a resolved Promise if the value has been set
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
   * Get a file's content accessible by it's channel number and a resource name
   * @param {number} channel
   * @param {string} resource
   * @return {Promise<string>} a resolved Promise containing the file's content
   */
  readChannel(channel, resource) {
    return Gpio.readFile(this.getChannelPath(channel, resource));
  }

  /**
   * Write content into a file accessible by it's channel number and a
   * resource name
   * @param {number} channel
   * @param {string} resource
   * @param {string|number} data
   * @return {Promise} a resolved Promise if the content has been set
   */
  writeChannel(channel, resource, data) {
    return Gpio.writeFile(this.getChannelPath(channel, resource), data);
  }

  /**
   * Get a file's content accessible by it's pathname
   * @static
   * @param {string} filename
   * @return {Promise<string>} a resolved Promise containing the file's content
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
      });
    });
  }

  /**
   * Write content into a file accessible by it's pathname
   * @param {string} filename
   * @param {string|number} data
   * @return {Promise} a resolved Promise if the content has been set
   */
  static writeFile(filename, data) {
    const pathname = path.join(Gpio.path, filename);

    return new Promise((resolve, reject) => {
      fs.writeFile(pathname, data, {
        encoding: 'utf8',
        flag: 'w+',
      }, (error, data) => {
        if (error) {
          reject(error);
        } else {
          resolve(data);
        }
      });
    });
  }

  /**
   * Returns true if the filename exists
   * @param {string} filename
   * @return {boolean} true if the file exists
   */
  static exists(filename) {
    return !!Catcher.resolve(() => fs.lstatSync(filename));
  }

  /**
   * Get the Revision indicated in the file at filename
   * @param {string} filename the path to search the Revision
   * @return {Number} the revision
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
    return Object.keys(Gpio.mappings).filter((key) => {
      return key <= revision || Gpio.revision;
    }).reduce((mapping, key) => {
      return Object.assign(mapping, Gpio.mappings[key]);
    }, {});
  }

  /**
   * Returns true if the Gpio has a channel
   * @param {number|string} channel
   * @return {boolean} true if the Gpio's mapping own the given channel
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
  3: ['0010', '0012', '0013'],
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
    26: 7,
  },
  1: {
    3: 0,
    5: 1,
    13: 21,
  },
  2: {
    3: 2,
    5: 3,
    13: 27,
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
    40: 21,
  },
});

/**
 * Raspberry Pi revision
 * @readonly
 * @type {number} the revision number
 */
Gpio.revision = Gpio.getRevision();

/**
 * The mapping Channel -> Pin
 * @readonly
 * @type {Object.<string, number>}
 */
Gpio.mapping = Gpio.getMapping(Gpio.revision);

/**
 * The pin mapping
 * @readonly
 * @type {Object.<number,number>}
 * @throws UnknownChannelError
 */
Gpio.pins = new Proxy({}, {
  get: (_, channel) => {
    return Gpio.mapping[String(channel)] || (() => {
        throw new UnknownChannelError(channel);
      })();
  },
});

/**
 * The directions
 * @readonly
 * @enum {string}
 */
Gpio.direction = Object.freeze({
  in: 'in',
  out: 'out',
});

/**
 * The edges
 * @readonly
 * @enum {string}
 */
Gpio.edge = Object.freeze({
  none: 'none',
  rising: 'rising',
  falling: 'falling',
  both: 'both',
});

/**
 * The signals
 * @readonly
 * @enum {number}
 */
Gpio.signal = Object.freeze({
  high: 1,
  low: 0,
});

/**
 * The possible paths to the Gpio
 * @readonly
 * @type {Array.<string>}
 */
Gpio.paths = Object.freeze([
  '/sys/devices/virtual/gpio',
  '/sys/class/gpio',
]);

/**
 * Path to the Gpio's channels
 * @type {string}
 * @readonly
 */
Gpio.path = Gpio.paths.find(Gpio.exists);


module.exports = Gpio;
