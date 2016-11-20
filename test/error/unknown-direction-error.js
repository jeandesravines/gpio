/**
 * Copyright 2016 Jean Desravines <hi@jeandesravines.com>
 */

'use strict';

const {describe, it} = require('mocha');
const {expect} = require('chai');
const UnknownDirectionError = require('../../lib/error/unknown-direction-error');

describe('UnknownDirectionError', () => {
  describe('Message', () => {
    it('should have a correct message', () => {
      const error = new UnknownDirectionError('unknown');

      expect(error.message).to.be.equal('Unknown direction: unknown');
    });
  });
});
