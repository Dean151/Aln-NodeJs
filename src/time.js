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

"use strict";

/**
 * Instantiate a new Time object to be used with the feeder
 * We have to create our own to make it work with the weird expectations of the feeder
 * If you don't provide any parameter, use "now" time to initialize.
 * @param {number} hours [0-23] (optional)
 * @param {number} minutes [0-59] (optional)
 */
function Time(hours, minutes) {
  if (hours === undefined && minutes === undefined) {
    let now = new Date();
    this._hours = now.getUTCHours();
    this._minutes = now.getUTCMinutes();
  }
  else {
    if (typeof hours === 'string' && minutes === undefined) {
      // hours is like '12:32:12'
      minutes = hours.slice(3,5); // Get the minutes first, we override hour
      hours = hours.slice(0,2);
    }

    let numberHours = Math.floor(+hours);
    if (numberHours >= 0 && numberHours % 24 === numberHours) {
      this._hours = numberHours;
    }

    let numberMinutes = Math.floor(+minutes);
    if (numberMinutes >= 0 && numberMinutes % 60 === numberMinutes) {
      this._minutes = numberMinutes;
    }
  }

  if (this._hours === undefined || this._minutes === undefined) {
    throw "hours or minutes parameters are unvalid";
  }
}

/**
 * Returns the number of seconds in integer since the chosen offset (default offset: 17h00)
 * @param {number} hours_offset ; default to 17 (optional)
 * @param {number} minutes_offset ; default to 0 (optional)
 * @return {number} the number of seconds since offset for this Time instance.
 */
Time.prototype.numberOfMinutes = function(hours_offset = 16, minutes_offset = 0) {
  let hours = (this._hours - hours_offset + 24) % 24;
  let minutes = (this._minutes - minutes_offset + 60) % 60;
  return hours * 60 + minutes;
};

/**
 * Returns the number of seconds in binary, readable by the feeder since the chosen offset (default offset: 17h00)
 * @param {number} hours_offset ; default to 17 (optional)
 * @param {number} minutes_offset ; default to 0 (optional)
 * @return {Buffer} the binary buffer representing the number of seconds since offset for this Time instance.
 */
Time.prototype.buffered = function(hours_offset = 16, minutes_offset = 0) {
  let seconds = this.numberOfMinutes(hours_offset, minutes_offset);
  let b2 = seconds % 256;
  let b1 = (seconds - b2) / 256;
  return Buffer.from([b1, b2]);
};

/**
 * Returns the time formatted for mysql (example 13:32:12)
 * @return {string} The time formatted
 */
Time.prototype.sqled = function() {
  return ('0' + this._hours).slice(-2) + ':' + ('0' + this._minutes).slice(-2) + ':00';
};

Time.prototype.jsoned = function() {
  return {
    hours: this._hours,
    minutes: this._minutes
  };
};

module.exports = Time;
