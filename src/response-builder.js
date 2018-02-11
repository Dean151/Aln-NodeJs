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

  // 9da10601
  var prefix = new Buffer([157, 161, 6, 1]);
  return Buffer.concat([prefix, time.buffered()]);
}

ResponseBuilder.changeDefaultQuantity = function(quantity) {
  var Quantity = require("./quantity");
  if (quantity.constructor !== Quantity) {
    throw "Wrong argument passed to changeDefaultQuantity()";
  }

  // 9da106c3
  var prefix = new Buffer([157, 161, 6, 195]);
  return Buffer.concat([prefix, quantity.buffered()]);
}

ResponseBuilder.changePlanning = function(planning) {
  var Planning = require("./planning");
  if (planning.constructor !== Planning) {
    throw "Wrong argument passed to changePlanning()";
  }

  // 9da12dc4
  var prefix = new Buffer([157, 161, 45, 196]);
  return Buffer.concat([prefix, planning.buffered()]);
}

ResponseBuilder.feedNow = function() {
  throw "Not implemented exception";
}

module.exports = ResponseBuilder;
