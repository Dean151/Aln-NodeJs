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

const Time = require('./time');
const Quantity = require('./quantity');

/**
 * Instanciate a new Meal object to be used with the feeder
 */
function Meal() {

  if (arguments.length === 2 && arguments[0].constructor == Time && arguments[1].constructor == Quantity) {
    this._time = arguments[0];
    this._quantity = arguments[1];
  }
  else if (arguments.length === 3) {
    this._time = new Time(arguments[0], arguments[1]);
    this._quantity = new Quantity(arguments[2]);
  }
  else {
    throw 'Wrong arguments in Meal constructor';
  }
}

Meal.prototype.time = function() {
  return this._time;
};

Meal.prototype.quantity = function() {
  return this._quantity;
};

module.exports = Meal;
