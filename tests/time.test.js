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

const Time = require('./../src/time');

// Default constructor
test('Time() should be "now" datetime', () => {
  var date = new Time();
  var now = new Date();
  expect(date._hours).toBe(now.getHours());
  expect(date._minutes).toBe(now.getMinutes());
});

// Unvalid constructors
test('Time() with unvalid parameters should throw', () => {
  expect(() => new Time(42, 0)).toThrow();
  expect(() => new Time(1, 61)).toThrow();  
  expect(() => new Time(-2, 0)).toThrow();  
  expect(() => new Time(5, -6)).toThrow();  
  expect(() => new Time(2)).toThrow();
});

// numberOfSeconds()
test('numberOfSeconds() should send the correct integer value', () => {
  // Default offset for the feeder
  expect((new Time(0,0)).numberOfSeconds()).toBe(420);
  expect((new Time(5,30)).numberOfSeconds()).toBe(750);
  expect((new Time(12,0)).numberOfSeconds()).toBe(1140);
  expect((new Time(16,59)).numberOfSeconds()).toBe(1439);
  expect((new Time(17,0)).numberOfSeconds()).toBe(0);
  expect((new Time(18,0)).numberOfSeconds()).toBe(60);
  expect((new Time(20,30)).numberOfSeconds()).toBe(210);

  // No offset
  expect((new Time(0,0)).numberOfSeconds(0,0)).toBe(0);
  expect((new Time(12,0)).numberOfSeconds(0,0)).toBe(720);

  // Some offsets
  expect((new Time(1,0)).numberOfSeconds(1,0)).toBe(0);
  expect((new Time(12,0)).numberOfSeconds(12,0)).toBe(0);
  expect((new Time(12,30)).numberOfSeconds(0,30)).toBe(720);
});

// buffered()
test('buffered() should send the correct binary value', () => {
  expect((new Time(0,0)).buffered().toString('hex')).toBe('01a4');
  expect((new Time(5,30)).buffered().toString('hex')).toBe('02ee');
  expect((new Time(12,0)).buffered().toString('hex')).toBe('0474');
  expect((new Time(16,59)).buffered().toString('hex')).toBe('059f');
  expect((new Time(17,0)).buffered().toString('hex')).toBe('0000');
  expect((new Time(17,1)).buffered().toString('hex')).toBe('0001');
  expect((new Time(17,10)).buffered().toString('hex')).toBe('000a');
  expect((new Time(17,16)).buffered().toString('hex')).toBe('0010');
  expect((new Time(18,0)).buffered().toString('hex')).toBe('003c');
  expect((new Time(20,30)).buffered().toString('hex')).toBe('00d2');
});
