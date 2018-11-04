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

const Time = require("./../src/time");

// Default constructor
test('Time() should be "now" datetime', () => {
  let date = new Time();
  let now = new Date();
  expect(date._hours).toBe(now.getUTCHours());
  expect(date._minutes).toBe(now.getUTCMinutes());
});

// Valid constructors for sql
test("Time() with sql format should work", () => {
  expect(new Time("00:00:00").sqled()).toBe("00:00:00");
  expect(new Time("04:30:00").sqled()).toBe("04:30:00");
  expect(new Time("11:00:00").sqled()).toBe("11:00:00");
  expect(new Time("15:59:00").sqled()).toBe("15:59:00");
  expect(new Time("16:00:00").sqled()).toBe("16:00:00");
  expect(new Time("16:01:00").sqled()).toBe("16:01:00");
  expect(new Time("16:10:00").sqled()).toBe("16:10:00");
  expect(new Time("16:16:00").sqled()).toBe("16:16:00");
  expect(new Time("17:00:00").sqled()).toBe("17:00:00");
  expect(new Time("19:30:00").sqled()).toBe("19:30:00");
});

// Unvalid constructors
test("Time() with unvalid parameters should throw", () => {
  expect(() => new Time(42, 0)).toThrow();
  expect(() => new Time(1, 61)).toThrow();
  expect(() => new Time(-2, 0)).toThrow();
  expect(() => new Time(5, -6)).toThrow();
  expect(() => new Time(2)).toThrow();
  expect(() => new Time("Hello", "World!")).toThrow();
  expect(() => new Time("8f", "2a")).toThrow();
});

// numberOfMinutes()
test("numberOfMinutes() should send the correct integer value", () => {
  // Default offset for the feeder
  expect(new Time(0, 0).numberOfMinutes()).toBe(480);
  expect(new Time(4, 30).numberOfMinutes()).toBe(750);
  expect(new Time(11, 0).numberOfMinutes()).toBe(1140);
  expect(new Time(15, 59).numberOfMinutes()).toBe(1439);
  expect(new Time(16, 0).numberOfMinutes()).toBe(0);
  expect(new Time(17, 0).numberOfMinutes()).toBe(60);
  expect(new Time(19, 30).numberOfMinutes()).toBe(210);

  // No offset
  expect(new Time(0, 0).numberOfMinutes(0, 0)).toBe(0);
  expect(new Time(12, 0).numberOfMinutes(0, 0)).toBe(720);

  // Some offsets
  expect(new Time(1, 0).numberOfMinutes(1, 0)).toBe(0);
  expect(new Time(12, 0).numberOfMinutes(12, 0)).toBe(0);
  expect(new Time(12, 30).numberOfMinutes(0, 30)).toBe(720);

  // Special
  expect(new Time(4.23, 30.151).numberOfMinutes()).toBe(750);
  expect(new Time("04", "30").numberOfMinutes()).toBe(750);
});

// buffered()
test("buffered() should send the correct binary value", () => {
  expect(new Time(0, 0).buffered().toString("hex")).toBe("01e0");
  expect(new Time(4, 30).buffered().toString("hex")).toBe("02ee");
  expect(new Time(11, 0).buffered().toString("hex")).toBe("0474");
  expect(new Time(15, 59).buffered().toString("hex")).toBe("059f");
  expect(new Time(16, 0).buffered().toString("hex")).toBe("0000");
  expect(new Time(16, 1).buffered().toString("hex")).toBe("0001");
  expect(new Time(16, 10).buffered().toString("hex")).toBe("000a");
  expect(new Time(16, 16).buffered().toString("hex")).toBe("0010");
  expect(new Time(17, 0).buffered().toString("hex")).toBe("003c");
  expect(new Time(19, 30).buffered().toString("hex")).toBe("00d2");
});

// sqled()
test("sqled() should send the correct value", () => {
  expect(new Time(0, 0).sqled()).toBe("00:00:00");
  expect(new Time(4, 30).sqled()).toBe("04:30:00");
  expect(new Time(11, 0).sqled()).toBe("11:00:00");
  expect(new Time(15, 59).sqled()).toBe("15:59:00");
  expect(new Time(16, 0).sqled()).toBe("16:00:00");
  expect(new Time(16, 1).sqled()).toBe("16:01:00");
  expect(new Time(16, 10).sqled()).toBe("16:10:00");
  expect(new Time(16, 16).sqled()).toBe("16:16:00");
  expect(new Time(17, 0).sqled()).toBe("17:00:00");
  expect(new Time(19, 30).sqled()).toBe("19:30:00");
});

// jsoned()
test("jsoned() should send the correct value", () => {
  expect(new Time(0, 0).jsoned()).toEqual({hours: 0, minutes: 0 });
  expect(new Time(4, 30).jsoned()).toEqual({hours: 4, minutes: 30 });
  expect(new Time(11, 0).jsoned()).toEqual({hours: 11, minutes: 0 });
  expect(new Time(15, 59).jsoned()).toEqual({hours: 15, minutes: 59 });
  expect(new Time(16, 0).jsoned()).toEqual({hours: 16, minutes: 0 });
  expect(new Time(16, 1).jsoned()).toEqual({hours: 16, minutes: 1 });
  expect(new Time(16, 10).jsoned()).toEqual({hours: 16, minutes: 10 });
  expect(new Time(16, 16).jsoned()).toEqual({hours: 16, minutes: 16 });
  expect(new Time(17, 0).jsoned()).toEqual({hours: 17, minutes: 0 });
  expect(new Time(19, 30).jsoned()).toEqual({hours: 19, minutes: 30 });
});
