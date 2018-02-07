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

const Meal = require("./../src/meal");
const Planning = require("./../src/planning");

test("numberOfMeals() tests", () => {
  expect(new Planning([]).numberOfMeals()).toBe(0);
  var meal1 = new Meal({ hours: 12, minutes: 30 }, 10);
  expect(new Planning([meal1]).numberOfMeals()).toBe(1);
  var meal2 = new Meal({ hours: 18, minutes: 20 }, 15);
  expect(new Planning([meal1, meal2]).numberOfMeals()).toBe(2);
  var meal3 = new Meal({ hours: 6, minutes: 0 }, 5);
  expect(new Planning([meal1, meal2, meal3]).numberOfMeals()).toBe(3);
});

test('totalQuantity() tests', () => {
  expect(new Planning([]).totalQuantity()).toBe(0);
  var meal1 = new Meal({ hours: 12, minutes: 30 }, 10);
  expect(new Planning([meal1]).totalQuantity()).toBe(10);
  var meal2 = new Meal({ hours: 18, minutes: 20 }, 15);
  expect(new Planning([meal1, meal2]).totalQuantity()).toBe(25);
  var meal3 = new Meal({ hours: 6, minutes: 0 }, 5);
  expect(new Planning([meal1, meal2, meal3]).totalQuantity()).toBe(30);
});
