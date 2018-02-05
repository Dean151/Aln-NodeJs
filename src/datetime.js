'use strict'

function DateTime(hours, minutes) {
  if (hours === undefined && minutes === undefined) {
    var now = new Date();
    this._hours = now.getHours();
    this._minutes = now.getMinutes();
  }
  else {
    if (hours >= 0 && hours % 24 === hours) {
      this._hours = hours;
    }
    if (minutes >= 0 && minutes % 60 === minutes) {
      this._minutes = minutes;
    }
  }

  if (this._hours === undefined || this._minutes === undefined) {
    throw 'hours or minutes parameters are unvalid';
  }
}

DateTime.prototype.numberOfSeconds = function() {
  var hours = ((this._hours - 17) + 24) % 24;
  return hours * 60 + this._minutes;
};

module.exports = DateTime;