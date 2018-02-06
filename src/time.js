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

/**
 * Instanciate a new Time object to be used with the feeder
 * We have to create our own to make it work with the weird expectations of the feeder
 * If you don't provide any parameter, use "now" time to initialize.
 * @param {number} hours [0-23] (optional)
 * @param {number} minutes [0-59] (optional)
 */
function Time(hours, minutes) {
  if (hours === undefined && minutes === undefined) {
    var now = new Date();
    this._hours = now.getHours();
    this._minutes = now.getMinutes();
  }
  else {
    var numberHours = Math.floor(+hours);
    if (numberHours >= 0 && numberHours % 24 === numberHours) {
      this._hours = numberHours;
    }
    
    var numberMinutes = Math.floor(+minutes);
    if (numberMinutes >= 0 && numberMinutes % 60 === numberMinutes) {
      this._minutes = numberMinutes;
    }
  }

  if (this._hours === undefined || this._minutes === undefined) {
    throw 'hours or minutes parameters are unvalid';
  }
}

/**
 * Returns the number of seconds in integer since the chosen offset (default offset: 17h00)
 * @param {number} hours_offset ; default to 17 (optional)
 * @param {number} minutes_offset ; default to 0 (optional)
 * @return {number} the number of seconds since offset for this Time instance.
 */
Time.prototype.numberOfSeconds = function(hours_offset = 17, minutes_offset = 0) {
  var hours = ((this._hours - hours_offset) + 24) % 24;
  var minutes = ((this._minutes - minutes_offset) + 60) % 60;
  return hours * 60 + minutes;
};

/**
 * Returns the number of seconds in binary, readable by the feeder since the chosen offset (default offset: 17h00)
 * @param {number} hours_offset ; default to 17 (optional)
 * @param {number} minutes_offset ; default to 0 (optional)
 * @return {Buffer} the binary buffer representing the number of seconds since offset for this Time instance.
 */
Time.prototype.buffered = function(hours_offset = 17, minutes_offset = 0) {
  var seconds = this.numberOfSeconds(hours_offset, minutes_offset);
  var b2 = seconds % 256;
  var b1 = (seconds - b2) / 256;
  return new Buffer([b1, b2]);
}

module.exports = Time;
