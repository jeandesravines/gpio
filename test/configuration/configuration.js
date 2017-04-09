/**
 * Copyright 2017 Jean Desravines <hi@jeandesravines.com>
 */

'use strict';

const {describe, it} = require('mocha');
const {expect} = require('chai');

describe('Configuration', () => {
  const filename = '../../lib/configuration/configuration';

  /* *************************************************** */

  describe('content', () => {
    it('should be customized', () => {
      process.env.PI_GPIO_FRAME = '10';
      process.env.PI_GPIO_FREQUENCY = '50';
      process.env.PI_GPIO_REVISION = '2';

      expect(require(filename)).to.be.deep.equal({
        frame: 10,
        frequency: 50,
        revision: 2,
      });
    });
  });
});
