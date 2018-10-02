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

/**
 * Instantiate a new Meal object to be used with the feeder
 */
function Meal(time, quantity) {
  if (time.constructor === Time) {
    this._time = time;
  } else if (time.hours !== undefined && time.minutes !== undefined) {
    this._time = new Time(time.hours, time.minutes);
  } else {
    this._time = new Time(time);
  }

  if (quantity.constructor === Quantity) {
    this._quantity = quantity;
  } else {
    this._quantity = new Quantity(quantity);
  }

  if (this._time === undefined || this._quantity === undefined) {
    throw "Wrong arguments in Meal constructor";
  }
}

Meal.prototype.time = function() {
  return this._time;
};

Meal.prototype.quantity = function() {
  return this._quantity;
};

Meal.prototype.buffered = function(hours_offset = 16, minutes_offset = 0) {
  return Buffer.concat([this.time().buffered(hours_offset, minutes_offset), this.quantity().buffered()]);
};

Meal.prototype.sqled = function(planId) {
  return [planId, this._time.sqled(), this._quantity.amount()];
};

Meal.prototype.jsoned = function() {
  return {
    time: this._time.jsoned(),
    quantity: this._quantity.jsoned()
  };
};

module.exports = Meal;
