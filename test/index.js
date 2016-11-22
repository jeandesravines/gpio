/**
 * Copyright 2016 Jean Desravines <hi@jeandesravines.com>
 */

'use strict';

const {before, beforeEach, afterEach} = require('mocha');
const Cleaner = require('../lib/helper/cleaner');

/* ********************************** */

before('Register modules to clean', () => {
  Cleaner.register([
    require.resolve('../lib/configuration/configuration'),
  ]);
});

beforeEach('Clean require.cache', Cleaner.clean);
afterEach('Clean require.cache', Cleaner.clean);
