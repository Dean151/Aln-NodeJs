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
  var meal1 = new Meal({ hours: 11, minutes: 30 }, 10);
  expect(new Planning([meal1]).numberOfMeals()).toBe(1);
  var meal2 = new Meal({ hours: 17, minutes: 20 }, 15);
  expect(new Planning([meal1, meal2]).numberOfMeals()).toBe(2);
  var meal3 = new Meal({ hours: 5, minutes: 0 }, 5);
  expect(new Planning([meal1, meal2, meal3]).numberOfMeals()).toBe(3);
});

test('totalQuantity() tests', () => {
  expect(new Planning([]).totalQuantity()).toBe(0);
  var meal1 = new Meal({ hours: 11, minutes: 30 }, 10);
  expect(new Planning([meal1]).totalQuantity()).toBe(10);
  var meal2 = new Meal({ hours: 17, minutes: 20 }, 15);
  expect(new Planning([meal1, meal2]).totalQuantity()).toBe(25);
  var meal3 = new Meal({ hours: 5, minutes: 0 }, 5);
  expect(new Planning([meal1, meal2, meal3]).totalQuantity()).toBe(30);
});

test('buffered() tests', () => {
  expect(new Planning([]).buffered().toString('hex')).toBe("00");
  var meal1 = new Meal({ hours: 11, minutes: 30 }, 10);
  expect(new Planning([meal1]).buffered().toString('hex')).toBe("010492000a");
  var meal2 = new Meal({ hours: 17, minutes: 20 }, 15);
  expect(new Planning([meal1, meal2]).buffered().toString('hex')).toBe("020492000a0050000f");
  var meal3 = new Meal({ hours: 5, minutes: 0 }, 5);
  expect(new Planning([meal1, meal2, meal3]).buffered().toString('hex')).toBe("030492000a0050000f030c0005");
});

test('sqled() tests', () => {
  expect(new Planning([]).sqled(3)).toEqual([]);
  var meal1 = new Meal({ hours: 11, minutes: 30 }, 10);
  expect(new Planning([meal1]).sqled(3)).toEqual([[3, '11:30:00', 10]]);
  var meal2 = new Meal({ hours: 17, minutes: 20 }, 15);
  expect(new Planning([meal1, meal2]).sqled(3)).toEqual([[3, '11:30:00', 10], [3, '17:20:00', 15]]);
  var meal3 = new Meal({ hours: 5, minutes: 0 }, 5);
  expect(new Planning([meal1, meal2, meal3]).sqled(3)).toEqual([[3, '11:30:00', 10], [3, '17:20:00', 15], [3, '05:00:00', 5]]);
});

test('jsoned() tests', () => {
  expect(new Planning([]).jsoned()).toEqual([]);
  var meal1 = new Meal({ hours: 11, minutes: 30 }, 10);
  expect(new Planning([meal1]).jsoned()).toEqual([{ time: { hours: 11, minutes: 30 }, quantity: 10 }]);
  var meal2 = new Meal({ hours: 17, minutes: 20 }, 15);
  expect(new Planning([meal1, meal2]).jsoned()).toEqual([{ time: { hours: 11, minutes: 30 }, quantity: 10 }, { time: { hours: 17, minutes: 20 }, quantity: 15 }]);
  var meal3 = new Meal({ hours: 5, minutes: 0 }, 5);
  expect(new Planning([meal1, meal2, meal3]).jsoned()).toEqual([{ time: { hours: 11, minutes: 30 }, quantity: 10 }, { time: { hours: 17, minutes: 20 }, quantity: 15 }, { time: { hours: 5, minutes: 0 }, quantity: 5 }]);
});
