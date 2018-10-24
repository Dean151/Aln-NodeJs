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
 * Instantiate a new Quantity object to be used with the feeder
 * You have to provide a correct amount quantity, in grams.
 * @param {number} amount [5-150] (required)
 */
function Quantity(amount) {
  if (isNaN(+amount)) {
    throw "Given amount is not a number";
  }

  let numberAmount = Math.floor(+amount);
  if (numberAmount < 5 || numberAmount > 150) {
    throw "Given amount is out of bounds (5g to 150g)";
  }

  this._amount = numberAmount;
}

/**
 * Getter for the amount property
 * @return {numeric} the amount associated to the quantity
 */
Quantity.prototype.amount = function() {
  return this._amount;
};

/**
 * Returns the amount of food in binary, readable by the feeder
 * @return {Buffer} the binary buffer representing the amount of food to give.
 */
Quantity.prototype.buffered = function() {
  return Buffer.from([0, this.amount()]);
};

Quantity.prototype.jsoned = function() {
  return this._amount;
};

module.exports = Quantity;
