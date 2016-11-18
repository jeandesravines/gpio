/**
 * Copyright 2016 Jean Desravines <hi@jeandesravines.com>
 */

'use strict';

const env = process.env;


module.exports = Object.freeze({
  frame: env.PI_GPIO_FRAME || 1,
  frequency: env.PI_GPIO_FREQUENCY || 120,
  revision: env.PI_GPIO_REVISION || 3,
});
