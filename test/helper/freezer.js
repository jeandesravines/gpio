/**
 * Copyright 2016 Jean Desravines <hi@jeandesravines.com>
 */

'use strict';

const {describe, it} = require('mocha');
const {expect} = require('chai');
const Freezer = require('../../lib/helper/freezer');

describe('Freezer', () => {
  describe('Freeze', () => {
    const object = {
      foo: 'bar',
      baz: {
        foo: 'bar',
      },
    };

    /* **************************************************** */

    it('should deeply freeze an object', () => {
      const frozen = Freezer.freeze(object);

      expect(frozen).to.be.deep.equal({
        foo: 'bar',
        baz: {
          foo: 'bar',
        },
      });

      expect(frozen === frozen).to.be.equal(true);
      expect(frozen === object).to.be.equal(false);
      expect(Object.isFrozen(frozen)).to.be.equal(true);
      expect(Object.isFrozen(frozen.foo)).to.be.equal(true);
    });

    it('should deeply freeze an array', () => {
      const frozen = Freezer.freeze([
        object,
      ]);

      expect(frozen).to.be.deep.equal([{
        foo: 'bar',
        baz: {
          foo: 'bar',
        },
      }]);

      expect(frozen === frozen).to.be.equal(true);
      expect(frozen[0] === object).to.be.equal(false);
      expect(Object.isFrozen(frozen)).to.be.equal(true);
      expect(Object.isFrozen(frozen[0])).to.be.equal(true);
      expect(Object.isFrozen(frozen[0].foo)).to.be.equal(true);
    });
  });
});
