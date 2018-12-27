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

const Time = require("./models/time");
const Quantity = require("./models/quantity");
const Planning = require("./models/planning");

class ResponseBuilder {

  /**
   * @returns {Buffer}
   */
  static time () {
    // 9d a1 06 01
    let prefix = Buffer.from([157, 161, 6, 1]);

    let time = new Time();
    return Buffer.concat([prefix, time.buffered()]);
  }

  /**
   * @param {Quantity} quantity
   * @throws
   * @returns {Buffer}
   */
  static changeDefaultQuantity (quantity) {
    if (quantity.constructor !== Quantity) {
      throw "Wrong argument passed to changeDefaultQuantity()";
    }

    // 9d a1 06 c3
    let prefix = Buffer.from([157, 161, 6, 195]);
    return Buffer.concat([prefix, quantity.buffered()]);
  }

  /**
   * @param {Planning} planning
   * @throws
   * @returns {Buffer}
   */
  static changePlanning (planning) {
    if (planning.constructor !== Planning) {
      throw "Wrong argument passed to changePlanning()";
    }

    // 9d a1 2d c4
    let prefix = Buffer.from([157, 161, 45, 196]);
    return Buffer.concat([prefix, planning.buffered()]);
  }

  /**
   * @param {Quantity} quantity
   * @throws
   * @returns {Buffer}
   */
  static feedNow (quantity) {
    if (quantity.constructor !== Quantity) {
      throw "Wrong argument passed to feedNow()";
    }

    // 9d a1 06 a2
    let prefix = Buffer.from([157, 161, 6, 162]);
    return Buffer.concat([prefix, quantity.buffered()]);
  }

  /**
   * @param {Buffer} data
   * @throws
   * @returns {{type: string, identifier: string}}
   */
  static recognize (data) {
    let hexString = data.toString('hex');
    if (hexString.match(/^9da114([0-9a-f]+)01d0010000$/)) {
      let hexIdentifier;
      if (hexString.match(/^(?:9da114([0-9a-f]+)01d0010000){2,}$/)) {
        // Sometime, identification is given twice in a row. We take care of any of those cases
        hexIdentifier = hexString.replace(/^(?:9da114([0-9a-f]+)01d0010000){2,}$/, "$1");
      }
      else {
        hexIdentifier = hexString.replace(/^9da114([0-9a-f]+)01d0010000$/, "$1");
      }
      let identifier = ResponseBuilder.decodeFeederIdentifier(hexIdentifier);
      return { type: 'identification', identifier: identifier };
    }
    else if (hexString.match(/^9da114([0-9a-f]+)21038400([0-9a-f]{2})$/)) {
      let hexIdentifier = hexString.replace(/^9da114([0-9a-f]+)21038400([0-9a-f]{2})$/, "$1");
      let identifier = ResponseBuilder.decodeFeederIdentifier(hexIdentifier);
      let amount = parseInt(hexString.slice(-2), 16);
      return { type: 'manual_meal', identifier: identifier, amount: amount };
    }
    else if (hexString.match(/^9da114([0-9a-f]+)c3d0a10000$/)) {
      let hexIdentifier = hexString.replace(/^9da114([0-9a-f]+)c3d0a10000$/, "$1");
      let identifier = ResponseBuilder.decodeFeederIdentifier(hexIdentifier);
      return { type: 'expectation', identifier: identifier, action: 'change_default_quantity' };
    }
    else if (hexString.match(/^9da114([0-9a-f]+)c4d0a10000$/)) {
      let hexIdentifier = hexString.replace(/^9da114([0-9a-f]+)c4d0a10000$/, "$1");
      let identifier = ResponseBuilder.decodeFeederIdentifier(hexIdentifier);
      return { type: 'expectation', identifier: identifier, action: 'change_planning' };
    }
    else if (hexString.match(/^9da114([0-9a-f]+)a2d0a10000$/)) {
      let hexIdentifier = hexString.replace(/^9da114([0-9a-f]+)a2d0a10000$/, "$1");
      let identifier = ResponseBuilder.decodeFeederIdentifier(hexIdentifier);
      return { type: 'expectation', identifier: identifier, action: 'feed_now' };
    }
    else {
      throw 'Unknown response';
    }
  }

  /**
   * @param {string} hexIdentifier
   * @throws
   * @returns {string}
   */
  static decodeFeederIdentifier (hexIdentifier) {
    let identifier = Buffer.from(hexIdentifier, 'hex').toString();
    if (!identifier.match(/^[a-z0-9]+$/i)) {
      throw 'Unvalid character in feeder identifier';
    }
    return identifier;
  }

  /**
   * @param {string} identifier
   * @returns {Buffer}
   */
  static feederIdentification (identifier) {
    // 9d a1 14
    let prefix = Buffer.from([157, 161, 20]);
    // 01 d0 01 00 00
    let suffix = Buffer.from([1, 208, 1, 0, 0]);
    return Buffer.concat([prefix, Buffer.from(identifier, 'utf8'), suffix]);
  }

  /**
   * @param {string} identifier
   * @param {Quantity} quantity
   * @returns {Buffer}
   */
  static mealButtonPressed (identifier, quantity) {
    // 9d a1 14
    let prefix = Buffer.from([157, 161, 20]);
    // 21 03 84
    let suffix = Buffer.from([33, 3, 132]);
    return Buffer.concat([prefix, Buffer.from(identifier, 'utf8'), suffix, quantity.buffered()]);
  }

  /**
   * @param {string} identifier
   * @returns {Buffer}
   */
  static changeDefaultQuantityExpectation (identifier) {
    // 9d a1 14
    let prefix = Buffer.from([157, 161, 20]);
    // c3 d0 a1 00 00
    let suffix = Buffer.from([195, 208, 161, 0, 0]);
    return Buffer.concat([prefix, Buffer.from(identifier, 'utf8'), suffix]);
  }

  /**
   * @param {string} identifier
   * @returns {Buffer}
   */
  static changePlanningExpectation (identifier) {
    // 9d a1 14
    let prefix = Buffer.from([157, 161, 20]);
    // c4 d0 a1 00 00
    let suffix = Buffer.from([196, 208, 161, 0, 0]);
    return Buffer.concat([prefix, Buffer.from(identifier, 'utf8'), suffix]);
  }

  /**
   * @param {string} identifier
   * @returns {Buffer}
   */
  static feedNowExpectation (identifier) {
    // 9d a1 14
    let prefix = Buffer.from([157, 161, 20]);
    // a2 d0 a1 00 00
    let suffix = Buffer.from([162, 208, 161, 0, 0]);
    return Buffer.concat([prefix, Buffer.from(identifier, 'utf8'), suffix]);
  }
}

module.exports = ResponseBuilder;
