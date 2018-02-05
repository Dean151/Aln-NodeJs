/*
Copyright (C) 2018 Dean151 a.k.a. Thomas Durand

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted, provided that the above
copyright notice and this permission notice appear in all copies.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES
WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF
MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR
ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES
WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION
OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF OR IN
CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
*/

'use strict'

var chai = require('chai');
var expect = chai.expect; // we are using the "expect" style of Chai

var DateTime = require('./../src/datetime');

describe('DateTime', function() {

  // Default constructor
  it('DateTime() should be "now" datetime', function() {
    var date = new DateTime();
    var now = new Date();
    expect(date._hours).to.equal(now.getHours());
    expect(date._minutes).to.equal(now.getMinutes());
  });

  // Unvalid constructions
  it('DateTime() with unvalid parameters should throw', function() {
    expect(() => new DateTime(42, 0)).to.throw();  
    expect(() => new DateTime(1, 61)).to.throw();  
    expect(() => new DateTime(-2, 0)).to.throw();  
    expect(() => new DateTime(5, -6)).to.throw();  
    expect(() => new DateTime(2)).to.throw();  
  });

  // numberOfSeconds()
  it('numberOfSeconds() should return 420 for midnight (17h is 0)', function() {
    var date = new DateTime(0, 0);
    expect(date.numberOfSeconds()).to.equal(420);
  });
  it('numberOfSeconds() should return 750 for 5h30', function() {
    var date = new DateTime(5,30);
    expect(date.numberOfSeconds()).to.equal(750);
  });
  it('numberOfSeconds() should return 1140 for 12h', function() {
    var date = new DateTime(12,0);
    expect(date.numberOfSeconds()).to.equal(1140);
  });
  it('numberOfSeconds() should return 1439 for 16h59', function() {
    var date = new DateTime(16,59);
    expect(date.numberOfSeconds()).to.equal(1439);
  });
  it('numberOfSeconds() should return 0 for 17h', function() {
    var date = new DateTime(17,0);
    expect(date.numberOfSeconds()).to.equal(0);
  });
  it('numberOfSeconds() should return 60 for 18h', function() {
    var date = new DateTime(18,0);
    expect(date.numberOfSeconds()).to.equal(60);
  });

  // buffered
  it('buffered() should return 01a4 for midnight (17h is 0)', function() {
    var date = new DateTime(0, 0);
    expect(date.buffered().toString('hex')).to.equal('01a4');
  });
  it('buffered() should return 02ee for 5h30', function() {
    var date = new DateTime(5,30);
    expect(date.buffered().toString('hex')).to.equal('02ee');
  });
  it('buffered() should return 0474 for 12h', function() {
    var date = new DateTime(12,0);
    expect(date.buffered().toString('hex')).to.equal('0474');
  });
  it('buffered() should return 059f for 16h59', function() {
    var date = new DateTime(16,59);
    expect(date.buffered().toString('hex')).to.equal('059f');
  });
  it('buffered() should return 0000 for 17h', function() {
    var date = new DateTime(17,0);
    expect(date.buffered().toString('hex')).to.equal('0000');
  });
  it('buffered() should return 003c for 18h', function() {
    var date = new DateTime(18,0);
    expect(date.buffered().toString('hex')).to.equal('003c');
  });
});
