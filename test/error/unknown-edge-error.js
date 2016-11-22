/**
 * Copyright 2016 Jean Desravines <hi@jeandesravines.com>
 */

'use strict';

const {describe, it} = require('mocha');
const {expect} = require('chai');
const UnknownEdgeError = require('../../lib/error/unknown-edge-error');

describe('UnknownEdgeError', () => {
  describe('Message', () => {
    it('should have a correct message', () => {
      const error = new UnknownEdgeError('unknown');

      expect(error.message).to.be.equal('Unknown edge: unknown');
    });
  });
});
