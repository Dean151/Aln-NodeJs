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

const Time = require("./time");
const Quantity = require("./quantity");

class Meal {

  /**
   * @param {Time|{hours: (number), minutes: (number)}|string} time
   * @param {Quantity|number} quantity
   * @param {boolean} enabled
   *
   * @throws
   */
  constructor (time, quantity, enabled = true) {
    if (time.constructor === Time) {
      this.time = time;
    } else if (time.hours !== undefined && time.minutes !== undefined) {
      this.time = new Time(time.hours, time.minutes);
    } else {
      this.time = new Time(time);
    }

    if (quantity.constructor === Quantity) {
      this.quantity = quantity;
    } else {
      this.quantity = new Quantity(quantity);
    }

    if (this.time === undefined || this.quantity === undefined) {
      throw "Wrong arguments in Meal constructor";
    }

    this.enabled = enabled;
  }

  /**
   * @param {number} offset_h
   * @param {number} offset_m
   * @returns {Buffer}
   */
  buffered (offset_h = 16, offset_m = 0) {
    return Buffer.concat([
      this.time.buffered(offset_h, offset_m),
      this.quantity.buffered()
    ]);
  }

  /**
   * @param {number} plan_id
   * @return {array}
   */
  sqled (plan_id) {
    return [
      plan_id,
      this.time.sqled(),
      this.quantity.amount,
      this.enabled
    ];
  }

  /**
   * @returns {{quantity: number, time: {hours: number, minutes: number}, enabled: boolean}}
   */
  jsoned () {
    return {
      time: this.time.jsoned(),
      quantity: this.quantity.jsoned(),
      enabled: this.enabled
    };
  }

}

module.exports = Meal;
