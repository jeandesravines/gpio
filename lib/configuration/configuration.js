/**
 * Copyright 2016 Jean Desravines <hi@jeandesravines.com>
 */

'use strict';

const env = process.env;
const configuration = Object.freeze({
  frame: Number.parseInt(env.PI_GPIO_FRAME || 1, 10),
  frequency: Number.parseInt(env.PI_GPIO_FREQUENCY || 120, 10),
  revision: Number.parseInt(env.PI_GPIO_REVISION || 3, 10),
});


module.exports = configuration;
