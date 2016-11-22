/**
 * Copyright 2016 Jean Desravines <hi@jeandesravines.com>
 */

'use strict';

const {before, beforeEach, afterEach, describe, it} = require('mocha');
const {expect} = require('chai');
const sinon = require('sinon');
const Cleaner = require('../../lib/helper/cleaner');

describe('Cleaner', () => {
  const modules = [
    require.resolve('../../lib/helper/freezer'),
    require.resolve('../../lib/helper/gpio'),
  ];

  let registered;

  before('Save Cleaner.registered', () => {
    registered = Cleaner.registered.slice(0);
  });

  beforeEach('Register modules', () => {
    Cleaner.register(modules);
  });

  afterEach('Reset Cleaner.registered', () => {
    Cleaner.registered.forEach((key) => {
      if (registered.keys.hasOwnProperty(key) === false) {
        Reflect.deleteProperty(Cleaner.registered, key);
      }
    });
  });

  /* ************************************************* */

  describe('Register', () => {
    it('should register modules', () => {
      expect(Cleaner.registered).to.be.deep.equal(registered.concat(modules));
    });

    it('should only register new modules', () => {
      const filename = require.resolve('../../lib/configuration/configuration');
      const aggregated = registered.concat(modules);

      Cleaner.register([filename]);

      expect(Cleaner.registered).to.be.deep.equal(aggregated);
    });
  });

  describe('Clean', () => {
    it('should clean process.env', () => {
      const key = 'FLIPPI_CLEANER_TEST';
      const spy = sinon.spy(Reflect, 'deleteProperty');
      const expectations = spy.withArgs(process.env, key);

      process.env[key] = 'Test';
      Cleaner.clean();

      expect(expectations.calledOnce).to.be.equal(true);
      spy.restore();
    });

    it('should clean require.cache', () => {
      const spy = sinon.spy(Reflect, 'deleteProperty');
      const expectations = registered.map((key) => {
        return spy.withArgs(require.cache, key);
      });

      registered.forEach((key) => require(key));
      Cleaner.clean();

      expectations.forEach((expectation) => {
        expect(expectation.calledOnce).to.be.equal(true);
      });
      spy.restore();
    });
  });
});
