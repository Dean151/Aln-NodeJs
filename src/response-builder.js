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
  var Time = require("./time");
  var time = new Time();

  // 9d a1 06 01
  var prefix = Buffer.from([157, 161, 6, 1]);
  return Buffer.concat([prefix, time.buffered()]);
}

ResponseBuilder.changeDefaultQuantity = function(quantity) {
  var Quantity = require("./quantity");
  if (quantity.constructor !== Quantity) {
    throw "Wrong argument passed to changeDefaultQuantity()";
  }

  // 9 da1 06 c3
  var prefix = Buffer.from([157, 161, 6, 195]);
  return Buffer.concat([prefix, quantity.buffered()]);
}

ResponseBuilder.changeDefaultQuantityExpectation = function(identifier) {
  // 9d a1 14
  var prefix = Buffer.from([157, 161, 20]);
  // c3 d0 a1 00 00
  var suffix = Buffer.from([195, 208, 161, 0, 0]);
  return Buffer.concat([prefix, Buffer.from(identifier, 'utf8'), suffix]);
}

ResponseBuilder.changePlanning = function(planning) {
  var Planning = require("./planning");
  if (planning.constructor !== Planning) {
    throw "Wrong argument passed to changePlanning()";
  }

  // 9d a1 2d c4
  var prefix = Buffer.from([157, 161, 45, 196]);
  return Buffer.concat([prefix, planning.buffered()]);
}

ResponseBuilder.changePlanningExpectation = function(identifier) {
  // 9d a1 14
  var prefix = Buffer.from([157, 161, 20]);
  // c4 d0 a1 00 00
  var suffix = Buffer.from([196, 208, 161, 0, 0]);
  return Buffer.concat([prefix, Buffer.from(identifier, 'utf8'), suffix]);
}

ResponseBuilder.feedNow = function(quantity) {
  var Quantity = require("./quantity");
  if (quantity.constructor !== Quantity) {
    throw "Wrong argument passed to feedNow()";
  }

  // 9d a1 06 a2
  var prefix = Buffer.from([157, 161, 6, 162]);
  return Buffer.concat([prefix, quantity.buffered()]);
}

ResponseBuilder.feedNowExpectation = function(identifier) {
  // 9d a1 14
  var prefix = Buffer.from([157, 161, 20]);
  // a2 d0 a1 00 00
  var suffix = Buffer.from([162, 208, 161, 0, 0]);
  return Buffer.concat([prefix, Buffer.from(identifier, 'utf8'), suffix]);
}

module.exports = ResponseBuilder;
