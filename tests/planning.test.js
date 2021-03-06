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

const Meal = require("../src/models/meal");
const Planning = require("../src/models/planning");

test("numberOfMeals() tests", () => {
  expect(new Planning([]).mealsCount()).toBe(0);
  let meal1 = new Meal({ hours: 11, minutes: 30 }, 10);
  expect(new Planning([meal1]).mealsCount()).toBe(1);
  let meal2 = new Meal({ hours: 17, minutes: 20 }, 15);
  expect(new Planning([meal1, meal2]).mealsCount()).toBe(2);
  let meal3 = new Meal({ hours: 5, minutes: 0 }, 5);
  expect(new Planning([meal1, meal2, meal3]).mealsCount()).toBe(3);
  let meal4 = new Meal({ hours: 12, minutes: 45}, 40, false);
  expect(new Planning([meal1, meal2, meal4]).mealsCount()).toBe(2);
});

test('totalQuantity() tests', () => {
  expect(new Planning([]).totalQuantity()).toBe(0);
  let meal1 = new Meal({ hours: 11, minutes: 30 }, 10);
  expect(new Planning([meal1]).totalQuantity()).toBe(10);
  let meal2 = new Meal({ hours: 17, minutes: 20 }, 15);
  expect(new Planning([meal1, meal2]).totalQuantity()).toBe(25);
  let meal3 = new Meal({ hours: 5, minutes: 0 }, 5);
  expect(new Planning([meal1, meal2, meal3]).totalQuantity()).toBe(30);
  let meal4 = new Meal({ hours: 12, minutes: 45}, 40, false);
  expect(new Planning([meal1, meal2, meal4]).totalQuantity()).toBe(25);
});

test('buffered() tests', () => {
  expect(new Planning([]).buffered().toString('hex')).toBe("00");
  let meal1 = new Meal({ hours: 11, minutes: 30 }, 10);
  expect(new Planning([meal1]).buffered().toString('hex')).toBe("010492000a");
  let meal2 = new Meal({ hours: 17, minutes: 20 }, 15);
  expect(new Planning([meal1, meal2]).buffered().toString('hex')).toBe("020492000a0050000f");
  let meal3 = new Meal({ hours: 5, minutes: 0 }, 5);
  expect(new Planning([meal1, meal2, meal3]).buffered().toString('hex')).toBe("030492000a0050000f030c0005");
  let meal4 = new Meal({ hours: 12, minutes: 45}, 40, false);
  expect(new Planning([meal1, meal2, meal4]).buffered().toString('hex')).toBe("020492000a0050000f");
});

test('sqled() tests', () => {
  expect(new Planning([]).sqled(3)).toEqual([]);
  let meal1 = new Meal({ hours: 11, minutes: 30 }, 10);
  expect(new Planning([meal1]).sqled(3)).toEqual([[3, '11:30:00', 10, true]]);
  let meal2 = new Meal({ hours: 17, minutes: 20 }, 15);
  expect(new Planning([meal1, meal2]).sqled(3)).toEqual([[3, '11:30:00', 10, true], [3, '17:20:00', 15, true]]);
  let meal3 = new Meal({ hours: 5, minutes: 0 }, 5);
  expect(new Planning([meal1, meal2, meal3]).sqled(3)).toEqual([[3, '11:30:00', 10, true], [3, '17:20:00', 15, true], [3, '05:00:00', 5, true]]);
  let meal4 = new Meal({ hours: 12, minutes: 45}, 40, false);
  expect(new Planning([meal1, meal2, meal4]).sqled(3)).toEqual([[3, '11:30:00', 10, true], [3, '17:20:00', 15, true], [3, '12:45:00', 40, false]]);
});

test('jsoned() tests', () => {
  expect(new Planning([]).jsoned()).toEqual([]);
  let meal1 = new Meal({ hours: 11, minutes: 30 }, 10);
  expect(new Planning([meal1]).jsoned()).toEqual([{ time: { hours: 11, minutes: 30 }, quantity: 10, enabled: true }]);
  let meal2 = new Meal({ hours: 17, minutes: 20 }, 15);
  expect(new Planning([meal1, meal2]).jsoned()).toEqual([{ time: { hours: 11, minutes: 30 }, quantity: 10, enabled: true }, { time: { hours: 17, minutes: 20 }, quantity: 15, enabled: true }]);
  let meal3 = new Meal({ hours: 5, minutes: 0 }, 5);
  expect(new Planning([meal1, meal2, meal3]).jsoned()).toEqual([{ time: { hours: 11, minutes: 30 }, quantity: 10, enabled: true }, { time: { hours: 17, minutes: 20 }, quantity: 15, enabled: true }, { time: { hours: 5, minutes: 0 }, quantity: 5, enabled: true }]);
  let meal4 = new Meal({ hours: 12, minutes: 45}, 40, false);
  expect(new Planning([meal1, meal2, meal4]).jsoned()).toEqual([{ time: { hours: 11, minutes: 30 }, quantity: 10, enabled: true }, { time: { hours: 17, minutes: 20 }, quantity: 15, enabled: true }, { time: { hours: 12, minutes: 45 }, quantity: 40, enabled: false }]);
});
