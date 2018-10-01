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

const Time = require("./../src/time");
const Quantity = require("./../src/quantity");
const Meal = require("./../src/meal");

test("Meal constructor", () => {
  // Two parameters
  expect(new Meal(new Time(11, 30), new Quantity(10)).time().numberOfMinutes()).toBe(1170);
  expect(new Meal(new Time(11, 30), new Quantity(10)).quantity().amount()).toBe(10);

  // Three parameters
  expect(new Meal({ hours: 11, minutes: 30 }, 10).time().numberOfMinutes()).toBe(1170);
  expect(new Meal({ hours: 11, minutes: 30 }, 10).quantity().amount()).toBe(10);
});

// Unvalid constructors
test("Meal() with unvalid parameters should throw", () => {
  expect(() => new Meal()).toThrow();
  expect(() => new Meal(1)).toThrow();
  expect(() => new Meal({ hours: -5, minutes: 0 }, 8)).toThrow();
  expect(() => new Meal({ hours: 0, minutes: 0 }, 151)).toThrow();
  expect(() => new Meal("Hello", "World")).toThrow();
  expect(() => new Meal({ hours: 24, minutes: 0 }, 5)).toThrow();
  expect(() => new Meal({ hours: 22, minutes: 60 }, 10)).toThrow();
  expect(() => new Meal({ hours: 22, minutes: 30 }, 0)).toThrow();
  expect(() => new Meal({}, 10)).toThrow();
});

// buffered()
test("buffered() should send the correct binary value", () => {
  expect(new Meal({ hours: 0, minutes: 0 }, 5).buffered(0, 0).toString("hex")).toBe("00000005");
  expect(new Meal({ hours: 7, minutes: 30 }, 8).buffered().toString("hex")).toBe("03a20008");
  expect(new Meal({ hours: 11, minutes: 30 }, 10).buffered().toString("hex")).toBe("0492000a");
  expect(new Meal({ hours: 15, minutes: 0 }, 11).buffered().toString("hex")).toBe("0564000b");
});

// sqled()
test("sqled() should send the correct value", () => {
  expect(new Meal({ hours: 0, minutes: 0 }, 5).sqled(5)).toEqual([5, '00:00:00', 5]);
  expect(new Meal({ hours: 7, minutes: 30 }, 8).sqled(5)).toEqual([5, '07:30:00', 8]);
  expect(new Meal({ hours: 11, minutes: 30 }, 10).sqled(5)).toEqual([5, '11:30:00', 10]);
  expect(new Meal({ hours: 15, minutes: 0 }, 11).sqled(5)).toEqual([5, '15:00:00', 11]);
});

// jsoned()
test("jsoned() should send the correct value", () => {
  expect(new Meal({ hours: 0, minutes: 0 }, 5).jsoned()).toEqual({ time: { hours: 0, minutes: 0 }, quantity: 5 });
  expect(new Meal({ hours: 7, minutes: 30 }, 8).jsoned()).toEqual({ time: { hours: 7, minutes: 30 }, quantity: 8 });
  expect(new Meal({ hours: 11, minutes: 30 }, 10).jsoned()).toEqual({ time: { hours: 11, minutes: 30 }, quantity: 10 });
  expect(new Meal({ hours: 15, minutes: 0 }, 11).jsoned()).toEqual({ time: { hours: 15, minutes: 0 }, quantity: 11 });
});
