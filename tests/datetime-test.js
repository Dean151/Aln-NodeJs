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
    var midnight = new DateTime(0, 0);
    expect(midnight.numberOfSeconds()).to.equal(420);
  });
  it('numberOfSeconds() should return 750 for 5h30', function() {
    var midnight = new DateTime(5,30);
    expect(midnight.numberOfSeconds()).to.equal(750);
  });
  it('numberOfSeconds() should return 1140 for 12h', function() {
    var midnight = new DateTime(12,0);
    expect(midnight.numberOfSeconds()).to.equal(1140);
  });
  it('numberOfSeconds() should return 0 for 17h', function() {
    var midnight = new DateTime(17,0);
    expect(midnight.numberOfSeconds()).to.equal(0);
  });
  it('numberOfSeconds() should return 60 for 18h', function() {
    var midnight = new DateTime(18,0);
    expect(midnight.numberOfSeconds()).to.equal(60);
  });
});
