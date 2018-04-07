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

function FeederCoordinator() {

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
        var identifier = new Buffer(hexIdentifier, 'hex').toString();
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
  server.listen(1032, "127.0.0.1", () => {
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

  console.log('Expecting ' + expectation);

  // Prepare a timeout for execution
  var timeout = setTimeout(() => {
    feeder._socket.removeListener('data', expectationListener);
    throw 'Timeout';
  }, 30000);

  var expectationListener = (data) => {
    var hexData = data.toString('hex');
    if (hexData == expectation) {
      if (typeof callback == 'function') {
        callback();
      }
      feeder._socket.removeListener('data', expectationListener);
      clearTimeout(timeout);
    }
  };

  // Listen for the expectation
  feeder._socket.on('data', expectationListener);

  // Write to the feeder
  FeederCoordinator.feeders[identifier].write(data, () => {
    console.log('Changing amount requested ...');
  });
}

FeederCoordinator.prototype.setDefaultQuantity = function (identifier, quantity, callback) {
  const ResponseBuilder = require("./response-builder");

  var expectation = '9da114' + Buffer.from(identifier, 'utf8').toString('hex') + 'c3d0a10000';
  this.writeAndExpect(identifier, ResponseBuilder.changeDefaultQuantity(quantity), expectation, () => {
    console.log('Amount changed');
    if (typeof callback == 'function') {
      callback();
    }
  });
}

FeederCoordinator.prototype.feedNow = function (identifier, callback) {
  const ResponseBuilder = require("./response-builder");
  this.write(identifier, ResponseBuilder.feedNow(), function() {
    console.log('Feeding requested');
    if (typeof callback == 'function') {
      callback();
    }
  });
}

FeederCoordinator.prototype.feedAmountNow = function (identifier, quantity, callback) {
  this.setDefaultQuantity(identifier, quantity, function() {
    this.feedNow(identifier, callback);
  });
}

module.exports = FeederCoordinator;
