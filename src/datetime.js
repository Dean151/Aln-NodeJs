'use strict'

function DateTime(hours, minutes) {
  this._hours = hours;
  this._minutes = minutes;
}

DateTime.prototype.numberOfSeconds = function() {
  var hours = ((this._hours - 17) + 24) % 24;
  return hours * 60 + this._minutes;
};

module.exports = DateTime;