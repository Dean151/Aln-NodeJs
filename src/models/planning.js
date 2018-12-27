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

class Planning {

  /**
   * @param {Meal[]} meals
   */
  constructor (meals) {
    this.meals = meals;
  }

  /**
   * @returns {Meal[]}
   */
  mealsEnabled () {
    return this.meals.filter((meal) => { return meal.enabled; });
  }

  /**
   * @returns {number}
   */
  mealsCount () {
    return this.mealsEnabled().length;
  }

  /**
   * @returns {number}
   */
  totalQuantity () {
    return this.mealsEnabled().reduce((amount, meal) => amount + meal.quantity.amount, 0);
  }

  /**
   * @returns {Buffer}
   */
  buffered () {
    let buffer = Buffer.from([this.mealsCount()]);
    return this.mealsEnabled().reduce((buf, meal) => Buffer.concat([buf, meal.buffered()]), buffer);
  }

  /**
   * @param plan_id
   * @returns {Array[]}
   */
  sqled (plan_id) {
    return this.meals.map((meal) => { return meal.sqled(plan_id); });
  }

  /**
   * @returns {{quantity: number, time: {hours: number, minutes: number}, enabled: boolean}[]}
   */
  jsoned () {
    return this.meals.map((meal) => { return meal.jsoned(); });
  }

}

module.exports = Planning;
