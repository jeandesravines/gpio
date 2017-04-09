/**
 * Copyright 2017 Jean Desravines <hi@jeandesravines.com>
 */

'use strict';

const {before, beforeEach, afterEach} = require('mocha');
const EnvCleaner = require('@jdes/env-cleaner');

/* ********************************** */

before('Register modules to clean', () => {
  EnvCleaner.register(require.resolve('../lib/configuration/configuration'));
});

beforeEach('Clean require.cache', EnvCleaner.clean);
afterEach('Clean require.cache', EnvCleaner.clean);
