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

function Planning(meals) {
  this._meals = meals;
}

Planning.prototype.enabledMeals = function() {
  return this._meals.filter((meal) => { return meal._enabled; });
};

Planning.prototype.numberOfMeals = function() {
  return this.enabledMeals().length;
};

Planning.prototype.totalQuantity = function() {
  return this.enabledMeals().reduce((amount, meal) => amount + meal.quantity().amount(), 0);
};

Planning.prototype.buffered = function() {
  let buffer = Buffer.from([this.numberOfMeals()]);
  return this.enabledMeals().reduce((buf, meal) => Buffer.concat([buf, meal.buffered()]), buffer);
};

// Return [{planning, time, quantity, enabled}]
Planning.prototype.sqled = function(planId) {
  return this._meals.map((meal) => { return meal.sqled(planId); });
};

Planning.prototype.jsoned = function() {
  return this._meals.map((meal) => { return meal.jsoned(); });
};

module.exports = Planning;
