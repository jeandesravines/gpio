/**
 * Copyright 2016 Jean Desravines <hi@jeandesravines.com>
 */

'use strict';

const {describe, it} = require('mocha');
const {expect} = require('chai');
const UnknownChannelError = require('../../lib/error/unknown-channel-error');

describe('UnknownChannelError', () => {
  describe('Message', () => {
    it('should have a correct message', () => {
      const error = new UnknownChannelError(12);

      expect(error.message).to.be.equal('Unknown channel: 12');
    });
  });
});
