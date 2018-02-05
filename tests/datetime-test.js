'use strict'

var chai = require('chai');
var expect = chai.expect; // we are using the "expect" style of Chai

var DateTime = require('./../src/datetime');

// numberOfSeconds()
describe('DateTime', function() {
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
