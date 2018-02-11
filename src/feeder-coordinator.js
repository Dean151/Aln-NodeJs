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

const Feeder = require("./feeder");

function FeederCoordinator() {}

FeederCoordinator.feeders = {};

FeederCoordinator.prototype.registerFeeder = function(identifier, socket) {
  if (FeederCoordinator.feeders[identifier] === undefined) {
    var feeder = new Feeder(identifier, socket);
    FeederCoordinator.feeders[identifier] = feeder;
  }
  else {
    FeederCoordinator.feeders[identifier].hasResponded(socket);
  }
}

FeederCoordinator.prototype.write = function (identifier, hexData, callback) {
  FeederCoordinator.feeders[identifier]._socket.write(hexData, 'hex', () => {
    console.log("Data sent: " + data);
    if (typeof(callback) == "function") {
      callback();
    }
  });
}

module.exports = FeederCoordinator;
