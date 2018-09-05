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

function FeederCoordinator(config) {

  const net = require("net");
  const server = net.createServer((c) => {
    console.log('Client connected');
    c.on('end', () => {
      console.log('Client disconnected');
    });
    c.on('data', (data) => {
      var hexData = data.toString('hex');
      console.log('Data received: ' + hexData);
      if (hexData.startsWith('9da114') && hexData.endsWith('01d0010000')) {
        // It's an feeder identifier
        var hexIdentifier = hexData.replace(/^9da114([0-9a-f]+)01d0010000$/, "$1");
        var identifier = Buffer.from(hexIdentifier, 'hex').toString();
        console.log('Feeder identified with: ' + identifier);

        // Register it
        this.registerFeeder(identifier, c);

        // Send it back the time
        const ResponseBuilder = require("./response-builder");
        this.write(identifier, ResponseBuilder.time());
      }
    });
    c.pipe(c);
  });

  server.on('error', (err) => {
    console.log('Error occurred: ' + err);
  });

  // Listen port 1032 ; that will be called by device
  server.listen(config.feeder_port, "127.0.0.1", () => {
    console.log('Listening to localhost:1032');
  });
}

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

FeederCoordinator.prototype.write = function (identifier, data, callback) {
  if (!(identifier in FeederCoordinator.feeders)) {
    throw 'Feeder not found';
  }
  FeederCoordinator.feeders[identifier].write(data, callback);
}

FeederCoordinator.prototype.writeAndExpect = function(identifier, data, expectation, callback) {
  if (!(identifier in FeederCoordinator.feeders)) {
    throw 'Feeder not found';
  }
  var feeder = FeederCoordinator.feeders[identifier];

  // Prepare a timeout for execution
  var timeout = setTimeout(() => {
    feeder._socket.removeListener('data', expectationListener);
    callback('timeout');
  }, 30000);

  var expectationListener = (data) => {
    if (data.toString('hex') == expectation.toString('hex')) {
      if (typeof callback == 'function') {
        callback('success');
      }
      feeder._socket.removeListener('data', expectationListener);
      clearTimeout(timeout);
    }
  };

  // Listen for the expectation
  feeder._socket.on('data', expectationListener);

  // Write to the feeder
  FeederCoordinator.feeders[identifier].write(data, () => {
    console.log('Waiting for expectation ...');
  });
}

FeederCoordinator.prototype.getFeeders = function () {
  return Object.keys(FeederCoordinator.feeders).reduce(function(previous, current) {
    var feeder = FeederCoordinator.feeders[current];
    previous[current] = {
      identifier: feeder._identifier,
      lastResponded: feeder._lastResponded.toJSON(),
      isAvailable: (Math.floor((new Date() - feeder._lastResponded) / 1000) <= 20),
    };
    return previous;
  }, {});
}

FeederCoordinator.prototype.setDefaultQuantity = function (identifier, quantity, callback) {
  const ResponseBuilder = require("./response-builder");

  var data = ResponseBuilder.changeDefaultQuantity(quantity);
  var expectation = ResponseBuilder.changeDefaultQuantityExpectation(identifier);
  this.writeAndExpect(identifier, data, expectation, (msg) => {
    if (typeof callback == 'function') {
      callback(msg);
    }
  });
}

FeederCoordinator.prototype.setPlanning = function (identifier, planning, callback) {
  const ResponseBuilder = require("./response-builder");

  var data = ResponseBuilder.changePlanning(planning);
  var expectation = ResponseBuilder.changePlanningExpectation(identifier);
  this.writeAndExpect(identifier, data, expectation, (msg) => {
    if (typeof callback == 'function') {
      callback(msg);
    }
  });
}

FeederCoordinator.prototype.feedNow = function (identifier, quantity, callback) {
  const ResponseBuilder = require("./response-builder");

  var data = ResponseBuilder.feedNow(quantity);
  var expectation = ResponseBuilder.feedNowExpectation(identifier);
  this.writeAndExpect(identifier, data, expectation, (msg) => {
    if (typeof callback == 'function') {
      callback(msg);
    }
  });
}

module.exports = FeederCoordinator;
