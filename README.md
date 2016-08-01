# Gpio

Control Raspberry Pi GPIO pins with NodeJS and ES6 Promises.


## Table of contents

* [Setup](#setup)
* [Usage](#usage)
* [API](#api)
    * [Constants](#constants) 
    * [Methods](#methods) 
* [Contributing](#contributing) 
* [Tests](#tests)
 

## Setup

This module can then be installed with npm:
```shell
$ npm install @jdes/gpio
```


## Usage

**!! IMPORTANT !!** You must run your application as root or with sudo to use the Raspberry's GPIO.

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
let gpio = new Gpio();
```

Before all operations on channel, you have to open it with `gpio.open(channel: number, direction: string): Promise`

Example:

```javascript
// Import
const Gpio = require('@jdes/gpio'):

// Instantiate
let gpio = new Gpio();

// Open the channel 7 on write mode
// and write an analog value
gpio.open(7, Gpio.direction.out)
    .then(() => gpio.setAnalogValue(7, 0.75, 120))
    .catch(console.error);
	
// Open the channel 3 on read mode
// and read an analog value during 500ms
gpio.open(3, Gpio.direction.in)
    .then(() => gpio.getAnalogValueValue(3, 500))
    .then((value) => {
        console.log(`Current value: ${value}`);
    })
    .catch(console.error);

// Close after 5s
setTimeout(() => {
	gpio.close(7);
	gpio.close(5);
}, 5000);
```


## API

### Constants

#### Gpio.direction: Object.<string, string>

Object representing the available directions

```json
{
    "in": "in",
    "out": "in"
}
```

#### Gpio.signal: Object.<string, number>

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
* returns a Promise resolved if the channel was opened or rejected if an error occurs

Sets up a channel for read or write. Must be done before the channel can be used.

Example:

```javascript
gpio.open(7, Gpio.direction.out)
    .then(() => {
    	console.log('channel 7 opened');
    })
    .catch((error) => {
    	console.error(error);
    });
```

#### close(channel: number): Promise

* `channel`: Reference to the pin in the current mode's schema.
* returns a Promise resolved if channel was closed or rejected if an error occurs

Close a channel

Example:

```javascript
gpio.close(7)
    .then(() => {
    	console.log('Channel 7 closed');
    })
    .catch((error) => {
    	console.error(error);
    });
```

#### getValue(channel: number): Promise

* `channel`: Reference to the pin in the current mode's schema.
* returns a Promise resolvde with the current value or rejected if an error occurs

Reads a digital value of a channel.

Example:

```javascript
gpio.getValue(7)
    .then((value) => {
        console.log(`Channel 7's value: ${value}`);
    })
    .catch((error) => {
    	console.error(error);
    });
```

#### setValue(channel: number, value: number): Promise

* `channel`: Reference to the pin in the current mode's schema.
* `value`: Boolean value to specify whether the channel will set to `Gpio.signal.low` or `Gpio.signal.high`.
* returns a Promise resolved if the value was set or rejected if an error occurs

Writes a digital value to a channel.

Example:

```javascript
gpio.setValue(7, Gpio.signal.high)
    .catch((error) => {
    	console.error(error);
    });
```

#### getAnalogValue(channel: number [, duration = 500]): Promise

* `channel`: Reference to the pin in the current mode's schema.
* `duration`: The duration (in ms) of computing
* returns a Promise resolved with the current value or rejected if an error occurs

Reads an analog value (float) from a channel.

Example:

```javascript
gpio.getAnalogValue(7)
    .then((value) => {
        console.log(`Channel 7 value: ${value}`);
    })
    .catch((error) => {
    	console.error(error);
    });
```

#### setAnalogValue(channel: number, value: float, frequency: number): Promise

* `channel`: Reference to the pin in the current mode's schema.
* `value`: The analog value. A float number `value ∈ [0, 1]`
* `frequency`: The frequency (in Hz) of refresh
* returns a Promise resolved if the value was set or rejected if an error occurs

Writes an analog value (float) to a channel.

Example:

```javascript
gpio.setAnalogValue(7, 0.75, 120)
    .catch((error) => {
    	console.error(error);
    });
```

#### getDirection(channel: number): Promise

* `channel`: Reference to the pin in the current mode's schema.
* returns a Promise resolved with the direction of the channel or rejected if an error occurs

Gets the direction of a channel.  
The resolved Promise will be returned with the current direction (a `Gpio.direction` value)

Example:

```javascript
gpio.getDirection(7)
    .then((direction) => {
        console.log(direction === Gpio.direction.out);
    })
    .catch((error) => {
    	console.error(error);
    });
```

#### setDirection(channel: number, direction: string): Promise

* `channel`: Reference to the pin in the current mode's schema.
* `direction`: The pin direction, pass either `Gpio.direction.in` for read mode or `Gpio.direction.out` for write mode.
* returns a Promise resolved if the direction was set or rejected if an error occurs

Changes the direction of a channel for read or write.

Example:

```javascript
gpio.setDirection(7, Gpio.direction.out)
    .then(() => {
        console.log('Direction set`on channel 7');
    })
    .catch((error) => {
    	console.error(error);
    });
```


## Example

```javascript
const Gpio = require('@jdes/gpio');
let gpio = new Gpio();

// Open the channel 3 in read mode
gpio.open(3, Gpio.direction.in)
    .then(() => {
        // Reads an analog value every seconds
        let interval = setInterval(() => {
            gpio.readAnalogValue(3)
                .then((3) => {
                    console.log(`Current value: ${value}`);
                });
        }, 1000);
        
        // After 10 seconds, stop reading and close channel
        setTimeout(() => {
            clearInterval(interval);
            gpio.close(3);
        }, 10000);
    })
    .catch((error) => {
    	console.error(error);
    });
```

## Contributing

Contributions are appreciated, both in the form of bug reports and pull requests.
All pull requests have to pass tests and have a sufficient coverage.

## Tests

You can run the tests with npm:
```shell
$ npm test
```


The tests use [Mocha](http://mochajs.org) as the test framework and [Chai](http://http://chaijs.com) as the BDD assertion framework.
The coverage is measured with [Istanbul](https://github.com/gotwarlost/istanbul).