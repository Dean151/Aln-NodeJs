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

const Meal = require("./meal");

function Planning(meals) {
  this._meals = meals;
}

Planning.prototype.numberOfMeals = function() {
  return this._meals.length;
}

Planning.prototype.totalQuantity = function() {
  return this._meals.reduce((amount, meal) => amount + meal.quantity().amount(), 0);
}

Planning.prototype.buffered = function() {
  var buffer = new Buffer([this.numberOfMeals()]);
  return this._meals.reduce((buf, meal) => Buffer.concat([buf, meal.buffered()]), buffer);
}

module.exports = Planning;
