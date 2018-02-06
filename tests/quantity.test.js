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

'use strict'

const Quantity = require('./../src/quantity');

// amout()
test('amout() should send the correct integer value', () => {
  expect((new Quantity(5)).amout()).toBe(5);
  expect((new Quantity(10)).amout()).toBe(10);
  expect((new Quantity(25)).amout()).toBe(25);
  expect((new Quantity(75)).amout()).toBe(75);
  expect((new Quantity(100)).amout()).toBe(100);
  expect((new Quantity(150)).amout()).toBe(150);

  // Particularities
  expect((new Quantity(5.25)).amout()).toBe(5);
  expect((new Quantity(10.9)).amout()).toBe(10);
  expect((new Quantity('05')).amout()).toBe(5);
  expect((new Quantity('100')).amout()).toBe(100);
});

// Unvalid constructors
test('Quantity() with unvalid parameters should throw', () => {
  expect(() => new Quantity()).toThrow();
  expect(() => new Quantity(0)).toThrow();  
  expect(() => new Quantity(-5)).toThrow();  
  expect(() => new Quantity(151)).toThrow();  
  expect(() => new Quantity('Hello')).toThrow();
  expect(() => new Quantity('8f')).toThrow();
  expect(() => new Quantity(2.5)).toThrow();
});

// buffered()
test('buffered() should send the correct binary value', () => {
  expect((new Quantity(5)).buffered().toString('hex')).toBe('05');
  expect((new Quantity(10)).buffered().toString('hex')).toBe('0a');
  expect((new Quantity(25)).buffered().toString('hex')).toBe('19');
  expect((new Quantity(50)).buffered().toString('hex')).toBe('32');
  expect((new Quantity(75)).buffered().toString('hex')).toBe('4b');
  expect((new Quantity(100)).buffered().toString('hex')).toBe('64');
  expect((new Quantity(125)).buffered().toString('hex')).toBe('7d');
  expect((new Quantity(150)).buffered().toString('hex')).toBe('96');
});
