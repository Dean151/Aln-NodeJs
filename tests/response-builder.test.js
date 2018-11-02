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

const ResponseBuilder = require("./../src/response-builder");
const Quantity = require("./../src/quantity");

test('ResponseBuilder.time() response is not valid', () => {
  // Time is from 0000 to 05a0
  expect(ResponseBuilder.time().toString('hex')).toMatch(/^9da106010[0-5][0-9a-f]{2}$/);
});

test('ResponseBuilder.changeDefaultQuantity() response is not valid', () => {
  for (let amount = 5; amount <= 150 ; amount++) {
    // Quantity is from 05 to 96
    expect(ResponseBuilder.changeDefaultQuantity(new Quantity(amount)).toString('hex')).toMatch(/^9da106c300[0-9][0-9a-f]$/);
  }

  // Test a few cases
  expect(ResponseBuilder.changeDefaultQuantity(new Quantity(5)).toString('hex')).toBe("9da106c30005");
  expect(ResponseBuilder.changeDefaultQuantity(new Quantity(12)).toString('hex')).toBe("9da106c3000c");
  expect(ResponseBuilder.changeDefaultQuantity(new Quantity(50)).toString('hex')).toBe("9da106c30032");
  expect(ResponseBuilder.changeDefaultQuantity(new Quantity(100)).toString('hex')).toBe("9da106c30064");
  expect(ResponseBuilder.changeDefaultQuantity(new Quantity(150)).toString('hex')).toBe("9da106c30096");
});

// TODO: test plannings

test('ResponseBuilder.feedNow() response is not valid', () => {
  for (let amount = 5; amount <= 150 ; amount++) {
    // Quantity is from 05 to 96
    expect(ResponseBuilder.feedNow(new Quantity(amount)).toString('hex')).toMatch(/^9da106a200[0-9][0-9a-f]$/);
  }

  // Test a few cases
  expect(ResponseBuilder.feedNow(new Quantity(5)).toString('hex')).toBe("9da106a20005");
  expect(ResponseBuilder.feedNow(new Quantity(12)).toString('hex')).toBe("9da106a2000c");
  expect(ResponseBuilder.feedNow(new Quantity(50)).toString('hex')).toBe("9da106a20032");
  expect(ResponseBuilder.feedNow(new Quantity(100)).toString('hex')).toBe("9da106a20064");
  expect(ResponseBuilder.feedNow(new Quantity(150)).toString('hex')).toBe("9da106a20096");
});

test('ResponseBuilder.recognize() response is not valid', () => {
  // Identification
  expect(ResponseBuilder.recognize(Buffer.from('9da11441424331323334353637383901d0010000', 'hex'))).toEqual({ type: 'identification', identifier: 'ABC123456789' });
  expect(ResponseBuilder.recognize(Buffer.from('9da1145a595839383736353433323101d0010000', 'hex'))).toEqual({ type: 'identification', identifier: 'ZYX987654321' });

  // Manual meal
  expect(ResponseBuilder.recognize(Buffer.from('9da1144142433132333435363738392103840005', 'hex'))).toEqual({ type: 'manual_meal', identifier: 'ABC123456789', amount: 5 });
  expect(ResponseBuilder.recognize(Buffer.from('9da1145a59583938373635343332312103840018', 'hex'))).toEqual({ type: 'manual_meal', identifier: 'ZYX987654321', amount: 24 });

  // Expectation Amount
  expect(ResponseBuilder.recognize(Buffer.from('9da114414243313233343536373839c3d0a10000', 'hex'))).toEqual({ type: 'expectation', identifier: 'ABC123456789', action: 'change_default_quantity' });
  expect(ResponseBuilder.recognize(Buffer.from('9da1145a5958393837363534333231c3d0a10000', 'hex'))).toEqual({ type: 'expectation', identifier: 'ZYX987654321', action: 'change_default_quantity' });

  // Expectation Planning
  expect(ResponseBuilder.recognize(Buffer.from('9da114414243313233343536373839c4d0a10000', 'hex'))).toEqual({ type: 'expectation', identifier: 'ABC123456789', action: 'change_planning' });
  expect(ResponseBuilder.recognize(Buffer.from('9da1145a5958393837363534333231c4d0a10000', 'hex'))).toEqual({ type: 'expectation', identifier: 'ZYX987654321', action: 'change_planning' });

  // Expectation Feed now
  expect(ResponseBuilder.recognize(Buffer.from('9da114414243313233343536373839a2d0a10000', 'hex'))).toEqual({ type: 'expectation', identifier: 'ABC123456789', action: 'feed_now' });
  expect(ResponseBuilder.recognize(Buffer.from('9da1145a5958393837363534333231a2d0a10000', 'hex'))).toEqual({ type: 'expectation', identifier: 'ZYX987654321', action: 'feed_now' });

  // Feeder empty
  expect(ResponseBuilder.recognize(Buffer.from('9da11441424331323334353637383921037d001e', 'hex'))).toEqual({ type: 'empty_feeder', identifier: 'ABC123456789', hours: 6, minutes: 53, amount: 30 });
  expect(ResponseBuilder.recognize(Buffer.from('9da1145a59583938373635343332312103850005', 'hex'))).toEqual({ type: 'empty_feeder', identifier: 'ZYX987654321', hours: 7, minutes: 1, amount: 5 });

  // TODO text unknown ?
});

test('ResponseBuilder.feederIdentification() response is not valid', () => {
  expect(ResponseBuilder.feederIdentification("ABC123456789").toString('hex')).toBe("9da11441424331323334353637383901d0010000");
  expect(ResponseBuilder.feederIdentification("ZYX987654321").toString('hex')).toBe("9da1145a595839383736353433323101d0010000");
});

test('ResponseBuilder.mealButtonPressed() response is not valid', () => {
  for (let amount = 5; amount <= 150 ; amount++) {
    // Quantity is from 05 to 96
    expect(ResponseBuilder.mealButtonPressed("ABC123456789", new Quantity(amount)).toString('hex')).toMatch(/9da11441424331323334353637383921038400[0-9][0-9a-f]$/);
    expect(ResponseBuilder.mealButtonPressed("ZYX987654321", new Quantity(amount)).toString('hex')).toMatch(/9da1145a595839383736353433323121038400[0-9][0-9a-f]$/);
  }

  // Test a few cases
  expect(ResponseBuilder.mealButtonPressed("ABC123456789", new Quantity(5)).toString('hex')).toBe("9da1144142433132333435363738392103840005");
  expect(ResponseBuilder.mealButtonPressed("ZYX987654321", new Quantity(5)).toString('hex')).toBe("9da1145a59583938373635343332312103840005");
  expect(ResponseBuilder.mealButtonPressed("ABC123456789", new Quantity(12)).toString('hex')).toBe("9da114414243313233343536373839210384000c");
  expect(ResponseBuilder.mealButtonPressed("ZYX987654321", new Quantity(12)).toString('hex')).toBe("9da1145a5958393837363534333231210384000c");
  expect(ResponseBuilder.mealButtonPressed("ABC123456789", new Quantity(50)).toString('hex')).toBe("9da1144142433132333435363738392103840032");
  expect(ResponseBuilder.mealButtonPressed("ZYX987654321", new Quantity(50)).toString('hex')).toBe("9da1145a59583938373635343332312103840032");
  expect(ResponseBuilder.mealButtonPressed("ABC123456789", new Quantity(100)).toString('hex')).toBe("9da1144142433132333435363738392103840064");
  expect(ResponseBuilder.mealButtonPressed("ZYX987654321", new Quantity(100)).toString('hex')).toBe("9da1145a59583938373635343332312103840064");
  expect(ResponseBuilder.mealButtonPressed("ABC123456789", new Quantity(150)).toString('hex')).toBe("9da1144142433132333435363738392103840096");
  expect(ResponseBuilder.mealButtonPressed("ZYX987654321", new Quantity(150)).toString('hex')).toBe("9da1145a59583938373635343332312103840096");
});

test('ResponseBuilder.changeDefaultQuantityExpectation() response is not valid', () => {
  expect(ResponseBuilder.changeDefaultQuantityExpectation("ABC123456789").toString('hex')).toBe("9da114414243313233343536373839c3d0a10000");
  expect(ResponseBuilder.changeDefaultQuantityExpectation("ZYX987654321").toString('hex')).toBe("9da1145a5958393837363534333231c3d0a10000");
});

test('ResponseBuilder.changePlanningExpectation() response is not valid', () => {
  expect(ResponseBuilder.changePlanningExpectation("ABC123456789").toString('hex')).toBe("9da114414243313233343536373839c4d0a10000");
  expect(ResponseBuilder.changePlanningExpectation("ZYX987654321").toString('hex')).toBe("9da1145a5958393837363534333231c4d0a10000");
});

test('ResponseBuilder.feedNowExpectation() response is not valid', () => {
  expect(ResponseBuilder.feedNowExpectation("ABC123456789").toString('hex')).toBe("9da114414243313233343536373839a2d0a10000");
  expect(ResponseBuilder.feedNowExpectation("ZYX987654321").toString('hex')).toBe("9da1145a5958393837363534333231a2d0a10000");
});
