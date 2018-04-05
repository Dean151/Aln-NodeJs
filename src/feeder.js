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

const Quantity = require("./quantity");
const Planning = require("./planning");

const Storage = require('node-storage');

function Feeder(identifier, socket) {
  this._identifier = identifier;
  this.hasResponded(socket);

  this.store = new Storage('data/storage.data');

  this.feederData = this.store.get(identifier);

  // Initializing data if missing
  if (typeof this.feederData === 'undefined') {
    this.feederData = {
      quantity: new Quantity(5),
      planning: new Planning([]),
    };
    this.saveData();
  }
}

Feeder.prototype.saveData = function() {
  this.store.put(this._identifier, this.feederData);
}

Feeder.prototype.quantity = function() {
  return this.feederData.quantity;
}

Feeder.prototype.planning = function() {
  return this.feederData.planning;
}

Feeder.prototype.hasResponded = function(socket) {
  this._socket = socket;
  this._lastResponded = new Date();
}

Feeder.prototype.write = function(data, callback) {
  var hexData = data.toString('hex');
  this._socket.write(hexData, 'hex', () => {
    console.log("Data sent: " + hexData);
    if (typeof callback == "function") {
      callback();
    }
  });
}

Feeder.prototype.setAmount = function(quantity, callback) {
  var message = Buffer.concat([new Buffer([157, 161, 6, 195]), quantity.buffered()]);
  this.write(message, function() {
    this.feederData.quantity = quantity
    this.saveData();

    console.log('Amount changed');
    if (typeof callback == 'function') {
      callback();
    }
  });
}

Feeder.prototype.feedNow = function(callback) {
  var message = new Buffer([]); // FIXME: We do not yet have the correct bytes sentence to send here
  this.write(message, function() {

    console.log('Feeding order sent');
    if (typeof callback == 'function') {
      callback();
    }
  });
}

Feeder.prototype.feedAmountNow = function(quantity, callback) {
  this.setAmount(quantity, function() {
    this.feedNow(function() {
      if (typeof callback == 'function') {
        callback();
      }
    });
  });
}

Feeder.prototype.setPlanning = function(planning, callback) {
  var message = Buffer.concat([new Buffer([157, 161, 5, 196]), planning.buffered()]);
  this.write(message, function() {
    this.feederData.planning = planning
    this.saveData();

    console.log('Planning changed');
    if (typeof callback == 'function') {
      callback();
    }
  });
}

module.exports = Feeder;
