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

DateTime.prototype.buffered = function() {
  var seconds = this.numberOfSeconds();
  var b2 = seconds % 256;
  var b1 = (seconds - b2) / 256;

  return new Buffer([b1, b2]);
}

module.exports = DateTime;
