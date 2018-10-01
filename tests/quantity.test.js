/*
Copyright (C) 2018 Dean151 a.k.a. Thomas Durand

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted, provided that the above
copyright notice and this permission notice appear in all copies.

THE SOFTWARE IS PROVIDED 'AS IS' AND THE AUTHOR DISCLAIMS ALL WARRANTIES
WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF
MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR
ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES
WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION
OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF OR IN
CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
*/

"use strict";

const Quantity = require("./../src/quantity");

// amount()
test("amount() should send the correct integer value", () => {
  expect(new Quantity(5).amount()).toBe(5);
  expect(new Quantity(10).amount()).toBe(10);
  expect(new Quantity(25).amount()).toBe(25);
  expect(new Quantity(75).amount()).toBe(75);
  expect(new Quantity(100).amount()).toBe(100);
  expect(new Quantity(150).amount()).toBe(150);

  // Particularities
  expect(new Quantity(5.25).amount()).toBe(5);
  expect(new Quantity(10.9).amount()).toBe(10);
  expect(new Quantity("05").amount()).toBe(5);
  expect(new Quantity("100").amount()).toBe(100);
});

// Unvalid constructors
test("Quantity() with unvalid parameters should throw", () => {
  expect(() => new Quantity()).toThrow();
  expect(() => new Quantity(0)).toThrow();
  expect(() => new Quantity(-5)).toThrow();
  expect(() => new Quantity(151)).toThrow();
  expect(() => new Quantity("Hello")).toThrow();
  expect(() => new Quantity("8f")).toThrow();
  expect(() => new Quantity(2.5)).toThrow();
});

// buffered()
test("buffered() should send the correct binary value", () => {
  expect(new Quantity(5).buffered().toString("hex")).toBe("0005");
  expect(new Quantity(10).buffered().toString("hex")).toBe("000a");
  expect(new Quantity(25).buffered().toString("hex")).toBe("0019");
  expect(new Quantity(50).buffered().toString("hex")).toBe("0032");
  expect(new Quantity(75).buffered().toString("hex")).toBe("004b");
  expect(new Quantity(100).buffered().toString("hex")).toBe("0064");
  expect(new Quantity(125).buffered().toString("hex")).toBe("007d");
  expect(new Quantity(150).buffered().toString("hex")).toBe("0096");
});

// jsoned()
test("jsoned() should send the correct value", () => {
  expect(new Quantity(5).jsoned()).toBe(5);
  expect(new Quantity(10).jsoned()).toBe(10);
  expect(new Quantity(25).jsoned()).toBe(25);
  expect(new Quantity(50).jsoned()).toBe(50);
  expect(new Quantity(75).jsoned()).toBe(75);
  expect(new Quantity(100).jsoned()).toBe(100);
  expect(new Quantity(125).jsoned()).toBe(125);
  expect(new Quantity(150).jsoned()).toBe(150);
});
