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

function ResponseBuilder() {}

ResponseBuilder.time = function() {
  let Time = require("./time");
  let time = new Time();

  // 9d a1 06 01
  let prefix = Buffer.from([157, 161, 6, 1]);
  return Buffer.concat([prefix, time.buffered()]);
};

ResponseBuilder.changeDefaultQuantity = function(quantity) {
  let Quantity = require("./quantity");
  if (quantity.constructor !== Quantity) {
    throw "Wrong argument passed to changeDefaultQuantity()";
  }

  // 9d a1 06 c3
  let prefix = Buffer.from([157, 161, 6, 195]);
  return Buffer.concat([prefix, quantity.buffered()]);
};

ResponseBuilder.changePlanning = function(planning) {
  let Planning = require("./planning");
  if (planning.constructor !== Planning) {
    throw "Wrong argument passed to changePlanning()";
  }

  // 9d a1 2d c4
  let prefix = Buffer.from([157, 161, 45, 196]);
  return Buffer.concat([prefix, planning.buffered()]);
};

ResponseBuilder.feedNow = function(quantity) {
  let Quantity = require("./quantity");
  if (quantity.constructor !== Quantity) {
    throw "Wrong argument passed to feedNow()";
  }

  // 9d a1 06 a2
  let prefix = Buffer.from([157, 161, 6, 162]);
  return Buffer.concat([prefix, quantity.buffered()]);
};

ResponseBuilder.recognize = function(data) {
  let hexString = data.toString('hex');
  if (hexString.match(/^9da114([0-9a-f]+)01d0010000$/)) {
    let identifier = Buffer.from(hexString.replace(/^9da114([0-9a-f]+)01d0010000$/, "$1"), 'hex').toString();
    return { type: 'identification', 'identifier': identifier };
  }
  else if (hexString.match(/^9da114([0-9a-f]+)21038400([0-9a-f]{2})$/)) {
    let identifier = Buffer.from(hexString.replace(/^9da114([0-9a-f]+)21038400([0-9a-f]{2})$/, "$1"), 'hex').toString();
    let amount = parseInt(hexString.slice(-2), 16);
    return { type: 'manual_meal', 'identifier': identifier, amount: amount };
  }
  else if (hexString.match(/^9da114([0-9a-f]+)c3d0a10000$/)) {
    let identifier = Buffer.from(hexString.replace(/^9da114([0-9a-f]+)c3d0a10000$/, "$1"), 'hex').toString();
    return { type: 'expectation', 'identifier': identifier, action: 'changeDefaultQuantity' };
  }
  else if (hexString.match(/^9da114([0-9a-f]+)c4d0a10000$/)) {
    let identifier = Buffer.from(hexString.replace(/^9da114([0-9a-f]+)c4d0a10000$/, "$1"), 'hex').toString();
    return { type: 'expectation', 'identifier': identifier, action: 'changePlanning' };
  }
  else if (hexString.match(/^9da114([0-9a-f]+)a2d0a10000$/)) {
    let identifier = Buffer.from(hexString.replace(/^9da114([0-9a-f]+)a2d0a10000$/, "$1"), 'hex').toString();
    return { type: 'expectation', 'identifier': identifier, action: 'feedNow' };
  }
  else {
    return { type: 'unknown' };
  }
};

ResponseBuilder.feederIdentification = function(identifier) {
  // 9d a1 14
  let prefix = Buffer.from([157, 161, 20]);
  // 01 d0 01 00 00
  let suffix = Buffer.from([1, 208, 1, 0, 0]);
  return Buffer.concat([prefix, Buffer.from(identifier, 'utf8'), suffix]);
};

ResponseBuilder.mealButtonPressed = function(identifier, quantity) {
  // 9d a1 14
  let prefix = Buffer.from([157, 161, 20]);
  // 21 03 84
  let suffix = Buffer.from([33, 3, 132]);
  return Buffer.concat([prefix, Buffer.from(identifier, 'utf8'), suffix, quantity.buffered()]);
};

ResponseBuilder.changeDefaultQuantityExpectation = function(identifier) {
  // 9d a1 14
  let prefix = Buffer.from([157, 161, 20]);
  // c3 d0 a1 00 00
  let suffix = Buffer.from([195, 208, 161, 0, 0]);
  return Buffer.concat([prefix, Buffer.from(identifier, 'utf8'), suffix]);
};

ResponseBuilder.changePlanningExpectation = function(identifier) {
  // 9d a1 14
  let prefix = Buffer.from([157, 161, 20]);
  // c4 d0 a1 00 00
  let suffix = Buffer.from([196, 208, 161, 0, 0]);
  return Buffer.concat([prefix, Buffer.from(identifier, 'utf8'), suffix]);
};

ResponseBuilder.feedNowExpectation = function(identifier) {
  // 9d a1 14
  let prefix = Buffer.from([157, 161, 20]);
  // a2 d0 a1 00 00
  let suffix = Buffer.from([162, 208, 161, 0, 0]);
  return Buffer.concat([prefix, Buffer.from(identifier, 'utf8'), suffix]);
};

module.exports = ResponseBuilder;
