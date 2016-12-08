# Gpio (Beta)

[![Build Status](https://travis-ci.org/jeandesravines/gpio.svg)](https://travis-ci.org/jeandesravines/gpio)
[![Coverage Status](https://coveralls.io/repos/github/jeandesravines/gpio/badge.svg)](https://coveralls.io/github/jeandesravines/gpio)

Control Raspberry Pi GPIO pins with Node.js and ES6 Promises.


## Table of contents

* [Setup](#setup)
* [Usage](#usage)
* [API](#api)
  * [Constants](#constants) 
  * [Methods](#methods) 
* [Example](#example)
* [Environment variables](#environment-variables)
 

## Setup

This module can then be installed with npm:
```shell
# npm install @jdes/gpio # unavailable during beta
# npm install git://github.com/jeandesravines/gpio
```


## Usage

**!! IMPORTANT !!** You must run your application as root to use the Raspberry's GPIO.

Import module:

```javascript
/**
 * @class {Gpio}
 */
const Gpio = require('@jdes/gpio');
```

Instantiate:

```javascript
/**
 * @type {Gpio}
 */
const gpio = new Gpio();
```

Before all operations on channel, you have to open it with `gpio.open(channel: number, direction: string): Promise`

Example:

```javascript
// Import
const Gpio = require('@jdes/gpio');

// Instantiate
const gpio = new Gpio();

// Open the channel 7 on write mode
// and write an analog value
gpio.open(7, Gpio.direction.out)
  .then(() => gpio.setAnalogValue(7, 0.75));

// Open the channel 3 on read mode
// and read an analog value during 500ms
gpio.open(3, Gpio.direction.in)
  .then(() => gpio.getAnalogValue(3, 500))
  .then((value) => {
    console.log(`Current value: ${value}`);
  });

// Close after 5s
setTimeout(() => {
  gpio.close(7);
  gpio.close(5);
}, 5000);
```


## API

### Constants

#### Gpio.direction: Object.\<string, string>

Object representing the available directions

```json
{
  "in": "in",
  "out": "in"
}
```

#### Gpio.signal: Object.\<string, number>

Object representing the available signals

```json
{
  "low": 0,
  "high": 1
}
```


### Methods

#### open(channel: number, direction: string): Promise

* `channel`: Reference to the pin in the current mode's schema.
* `direction`: The pin direction, pass either `Gpio.direction.in` for read mode or `Gpio.direction.out` for write mode.
* returns a `Promise` resolved if the channel was opened or rejected if an error occurs

Sets up a channel for read or write. Must be done before the channel can be used.

Example:

```javascript
gpio.open(7, Gpio.direction.out)
  .then(() => {
    console.log('channel 7 opened');
  });
```

#### close(channel: number): Promise

* `channel`: Reference to the pin in the current mode's schema.
* returns a `Promise` resolved if channel was closed or rejected if an error occurs

Close a channel

Example:

```javascript
gpio.close(7)
  .then(() => {
    console.log('Channel 7 closed');
  });
```

#### getValue(channel: number): Promise.\<number>

* `channel`: Reference to the pin in the current mode's schema.
* returns a `Promise.<number>` resolvde with the current value or rejected if an error occurs

Reads a digital value of a channel.

Example:

```javascript
gpio.getValue(7)
  .then((value) => {
    console.log(`Channel 7's value: ${value}`);
  });
```

#### setValue(channel: number, value: number): Promise

* `channel`: Reference to the pin in the current mode's schema.
* `value`: Boolean value to specify whether the channel will set to `Gpio.signal.low` or `Gpio.signal.high`.
* returns a `Promise` resolved if the value was set or rejected if an error occurs

Writes a digital value to a channel.

Example:

```javascript
gpio.setValue(7, Gpio.signal.high);
```

#### getAnalogValue(channel: number, [duration: number = 500]): Promise.\<number>

* `channel`: Reference to the pin in the current mode's schema.
* `duration`: The duration (in ms) of computing
* returns a `Promise.<number>` resolved with the current value or rejected if an error occurs

Reads an analog value (float) from a channel.

Example:

```javascript
gpio.getAnalogValue(7)
  .then((value) => {
    console.log(`Channel 7 value: ${value}`);
  });
```

#### setAnalogValue(channel: number, value: float, frequency: number): Promise

* `channel`: Reference to the pin in the current mode's schema.
* `value`: The analog value. A float number `value ∈ [0, 1]`
* returns a `Promise` resolved if the value was set or rejected if an error occurs

Writes an analog value (float) to a channel.

Example:

```javascript
gpio.setAnalogValue(7, 0.75);
```

#### getDirection(channel: number): Promise.\<string>

* `channel`: Reference to the pin in the current mode's schema.
* returns a Promise resolved with the direction of the channel or rejected if an error occurs

Gets the direction of a channel.  
The resolved `Promise.<string>` will be returned with the current direction (a `Gpio.direction` value)

Example:

```javascript
gpio.getDirection(7)
  .then((direction) => {
    console.log(direction === Gpio.direction.out);
  });
```

#### setDirection(channel: number, direction: string): Promise

* `channel`: Reference to the pin in the current mode's schema.
* `direction`: The pin direction, pass either `Gpio.direction.in` for read mode or `Gpio.direction.out` for write mode.
* returns a `Promise` resolved if the direction was set or rejected if an error occurs

Changes the direction of a channel for read or write.

Example:

```javascript
gpio.setDirection(7, Gpio.direction.out)
  .then(() => {
    console.log('Direction set`on channel 7');
  });
```


## Example

```javascript
const Gpio = require('@jdes/gpio');
const gpio = new Gpio();

// Open the channel 3 in read mode
gpio.open(3, Gpio.direction.in)
  .then(() => {
    // Reads an analog value every seconds
    const interval = setInterval(() => {
      gpio.getAnalogValue(3)
        .then((value) => {
          console.log(`Current value: ${value}`);
        });
    }, 1000);
    
    // After 10 seconds, stop reading and close channel
    setTimeout(() => {
      clearInterval(interval);
      gpio.close(3);
    }, 10000);
  });
```
 

## Environment variables

Environment variables can be passed to override the default configuration.

### Frame

Time in ms for computing an analog read.  
If `PI_GPIO_FRAME = 1`, at each ms à digital read is perform and at the end, an average value of each digital read will be produce.  
If the process has to be executed during 200ms, 200 reads will be performed and the analog value will be equal to  `countOn / 200`.

- Options: `PI_GPIO_FRAME`
- Type: `Number`
- Default: `1`

### Revision

The default Rapsberry Pi revision if none match.  
It's useful to determine the GPIO mapping.

- Options: `PI_GPIO_REVISION`
- Type: `Number`
- Default: `3`

### Frequency

Frequency in Hz for execute an analog write.  
If `PI_GPIO_FREQUENCY = 50`, during a write, 20 (1000 / 50) on-off process will be performed.  

- Options: `PI_GPIO_FREQUENCY`
- Type: `Number`
- Default: `120`

#### On-Off process
If `PI_GPIO_FREQUENCY = 50` and the value to write is `0.75`, the on-off process will be performed 20 times.  
Every 20ms it writes `1` to the pin and after 15ms (20 * 0.75) it will writes `0`.  
