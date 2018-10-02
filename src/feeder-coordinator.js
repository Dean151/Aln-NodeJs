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

function FeederCoordinator(databaseCoordinator, config) {

  this.databaseCoordinator = databaseCoordinator;

  const net = require("net");
  const server = net.createServer((c) => {
    console.log('Client connected');
    c.on('end', () => {
      console.log('Client disconnected');
    });
    c.on('data', (data) => {
      let hexData = data.toString('hex');
      console.log('Data received: ' + hexData);
      if (hexData.startsWith('9da114') && hexData.endsWith('01d0010000')) {
        // It's an feeder identifier
        let identifier = Buffer.from(hexData.replace(/^9da114([0-9a-f]+)01d0010000$/, "$1"), 'hex').toString();

        if (config.allowed_feeders.length && !config.allowed_feeders.includes(identifier)) {
          console.log('Unauthorized feeder detected: ' + identifier);
          this.databaseCoordinator.logUnknownData('unauthorized', data);
          c.destroy();
        }
        else {
          console.log('Feeder identified with: ' + identifier);

          // Register it
          this.registerFeeder(identifier, c);

          // Send it back the time
          const ResponseBuilder = require("./response-builder");
          this.write(identifier, ResponseBuilder.time());

          // Maintain the connection with the socket
          c.setKeepAlive(true, 30000);
        }
      }
      else {
        this.databaseCoordinator.logUnknownData('unknown', data);
      }
    });
  });

  server.on('error', (err) => {
    console.log('Error occurred: ' + err);
  });

  // Listen on given port ; that will be called by device
  server.listen(config.feeder_port, () => {
    console.log('Listening to port', config.feeder_port);
  });
}

FeederCoordinator.feeders = {};

FeederCoordinator.prototype.registerFeeder = function(identifier, socket) {
  if (FeederCoordinator.feeders[identifier] === undefined) {
    FeederCoordinator.feeders[identifier] = new Feeder(identifier, socket);
  }
  else {
    FeederCoordinator.feeders[identifier].hasResponded(socket);
  }

  // Register it in database
  this.databaseCoordinator.registerFeeder(identifier);
};

FeederCoordinator.prototype.write = function (identifier, data, callback) {
  if (!(identifier in FeederCoordinator.feeders)) {
    throw 'Feeder not found';
  }
  FeederCoordinator.feeders[identifier].write(data, callback);
};

FeederCoordinator.prototype.writeAndExpect = function(identifier, data, expectation, callback) {
  if (!(identifier in FeederCoordinator.feeders)) {
    throw 'Feeder not found';
  }
  let feeder = FeederCoordinator.feeders[identifier];

  // Prepare a timeout for execution
  let timeout = setTimeout(() => {
    feeder._socket.removeListener('data', expectationListener);
    callback('timeout');
  }, 30000);

  let expectationListener = (data) => {
    if (data.toString('hex') === expectation.toString('hex')) {
      if (typeof callback === 'function') {
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
};

FeederCoordinator.prototype.getFeeders = function () {
  return Object.keys(FeederCoordinator.feeders).reduce(function(previous, current) {
    let feeder = FeederCoordinator.feeders[current];
    previous[current] = {
      identifier: feeder._identifier,
      lastResponded: feeder._lastResponded.toJSON(),
      isAvailable: (Math.floor((new Date() - feeder._lastResponded) / 1000) <= 20),
    };
    return previous;
  }, {});
};

FeederCoordinator.prototype.setDefaultQuantity = function (identifier, quantity, callback) {
  const ResponseBuilder = require("./response-builder");

  let data = ResponseBuilder.changeDefaultQuantity(quantity);
  let expectation = ResponseBuilder.changeDefaultQuantityExpectation(identifier);
  this.writeAndExpect(identifier, data, expectation, (msg) => {
    this.databaseCoordinator.rememberDefaultAmount(identifier, quantity);
    if (typeof callback === 'function') {
      callback(msg);
    }
  });
};

FeederCoordinator.prototype.setPlanning = function (identifier, planning, callback) {
  const ResponseBuilder = require("./response-builder");

  let data = ResponseBuilder.changePlanning(planning);
  let expectation = ResponseBuilder.changePlanningExpectation(identifier);
  this.writeAndExpect(identifier, data, expectation, (msg) => {
    this.databaseCoordinator.recordPlanning(identifier, planning);
    if (typeof callback === 'function') {
      callback(msg);
    }
  });
};

FeederCoordinator.prototype.feedNow = function (identifier, quantity, callback) {
  const ResponseBuilder = require("./response-builder");

  let data = ResponseBuilder.feedNow(quantity);
  let expectation = ResponseBuilder.feedNowExpectation(identifier);
  this.writeAndExpect(identifier, data, expectation, (msg) => {
    this.databaseCoordinator.recordMeal(identifier, quantity);
    if (typeof callback === 'function') {
      callback(msg);
    }
  });
};

module.exports = FeederCoordinator;
