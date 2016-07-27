/**
 * Copyright 2016 Jean Desravines <hi@jeandesravines.com>
 */

'use strict';

const {describe, it} = require('mocha');
const {expect, should} = require('chai');
const fs = require('fs');
const promisify = require('../lib/module/promisify');

describe('Promisifier', () => {
	describe('Type', () => {
		it('should return a function', () => {
			expect(promisify(fs.readFile)).to.be.a('function');
		});

		it('should return a function which return a Promise', () => {
			expect(promisify(fs.readFile)('/dev/null')).to.be.a('promise');
		});
	});

	describe('IO', () => {
		it('should resolve the promise', () => {
			return promisify(fs.readFile)('/dev/null');
		});

		it('should reject the promise', () => {
			return promisify(fs.readFile)('./promisifier/unknown')
				.then(() => Promise.reject())
				.catch(() => Promise.resolve());
		});
	});
});