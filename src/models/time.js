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

class Time {

  /**
   * @param {number|string|null} hours
   * @param {number|null} minutes
   * @throws
   */
  constructor (hours = null, minutes = null) {
    if (hours === null && minutes === null) {
      let now = new Date();
      this.hours = now.getUTCHours();
      this.minutes = now.getUTCMinutes();
    }
    else {
      if (typeof hours === 'string' && minutes === null) {
        // hours is like '12:32:12'
        minutes = hours.slice(3,5); // Get the minutes first, we override hour
        hours = hours.slice(0,2);
      }
      else if (minutes === null || hours === null) {
        throw "hours or minutes parameters are unvalid";
      }

      let numberHours = Math.floor(+hours);
      if (numberHours >= 0 && numberHours % 24 === numberHours) {
        this.hours = numberHours;
      }

      let numberMinutes = Math.floor(+minutes);
      if (numberMinutes >= 0 && numberMinutes % 60 === numberMinutes) {
        this.minutes = numberMinutes;
      }
    }

    if (this.hours === undefined || this.minutes === undefined) {
      throw "hours or minutes parameters are unvalid";
    }
  }

  /**
   * @param {number} offset_h
   * @param {number} offset_m
   * @returns {number}
   */
  numberOfMinutes (offset_h = 16, offset_m = 0) {
    let hours = (this.hours - offset_h + 24) % 24;
    let minutes = (this.minutes - offset_m + 60) % 60;
    return hours * 60 + minutes;
  }

  /**
   * @param {number} offset_h
   * @param {number} offset_m
   * @returns {Buffer}
   */
  buffered (offset_h = 16, offset_m = 0) {
    let seconds = this.numberOfMinutes(offset_h, offset_m);
    let b2 = seconds % 256;
    let b1 = (seconds - b2) / 256;
    return Buffer.from([b1, b2]);
  }

  /**
   * Returns the time formatted for mysql (example 13:32:12)
   * @return {string} The time formatted
   */
  sqled () {
    return ('0' + this.hours).slice(-2) + ':' + ('0' + this.minutes).slice(-2) + ':00';
  }

  /**
   * @returns {{hours: (number), minutes: (number)}}
   */
  jsoned () {
    return {
      hours: this.hours,
      minutes: this.minutes
    };
  }

}

module.exports = Time;
