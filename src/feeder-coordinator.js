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

import Feeder from './feeder';
import ResponseBuilder from './response-builder';
import Quantity from './quantity';

function FeederCoordinator(databaseCoordinator, config) {

  this.databaseCoordinator = databaseCoordinator;

  const net = require("net");
  const server = net.createServer((socket) => {

    // Depending on the mode, we reject ; or not ; the socket
    let isInList = config.feeder_list === undefined ? false : config.feeder_list.reduce((carry, item) => {
      return carry || item === socket.remoteAddress;
    }, false);
    if (config.feeder_mode === 'whitelist' && !isInList || config.feeder_mode === 'blacklist' && isInList) {
      // Do not even attempt to wait something since the ip is unauthorized
      socket.destroy();
      return;
    }

    let ip = socket.remoteAddress + ":" + socket.remotePort;
    console.log('Client connected:', ip);
    socket.on('end', () => {
      console.log('Client disconnected:', ip);
    });
    socket.on('data', (data) => {
      console.log('Data received from', ip, ':', data.toString('hex'));

      try {
        let treatedData = ResponseBuilder.recognize(data);
        switch (treatedData.type) {
          case 'identification':
            this.identifyFeeder(treatedData.identifier, ip, socket);
            break;
          case 'manual_meal':
            let quantity = new Quantity(treatedData.amount);
            this.databaseCoordinator.recordMeal(treatedData.identifier, quantity);
            this.databaseCoordinator.rememberDefaultAmount(treatedData.identifier, quantity);
            break;
          case 'empty_feeder':
            // TODO: Later, push notification sending?
            let data = {hours: treatedData.hours, minutes: treatedData.minutes, amount: treatedData.amount};
            this.databaseCoordinator.logAlert(treatedData.identifier, 'empty', data);
            break;
          case 'expectation':
            break;
          default:
            throw 'Untreated response type';
        }
      }
      catch (e) {
        this.databaseCoordinator.logUnknownData(e.message, data, ip);
        socket.destroy();
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

FeederCoordinator.prototype.identifyFeeder = function(identifier, ip, socket) {
  console.log('Feeder identified with', identifier);

  if (FeederCoordinator.feeders[identifier] === undefined) {
    FeederCoordinator.feeders[identifier] = new Feeder(identifier, socket);
  }
  else {
    FeederCoordinator.feeders[identifier].hasResponded(socket);
  }

  // Send it back the time
  this.write(identifier, ResponseBuilder.time());

  // Maintain the connection with the socket
  socket.setKeepAlive(true, 30000);

  // Register it in database
  this.databaseCoordinator.registerFeeder(identifier, ip);
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

FeederCoordinator.prototype.getFeeder = function (identifier) {
  if (!(identifier in FeederCoordinator.feeders)) {
    throw 'Feeder not found';
  }
  let feeder = FeederCoordinator.feeders[identifier];
  return {
    identifier: feeder._identifier,
    lastResponded: feeder._lastResponded.toJSON(),
    isAvailable: (Math.floor((new Date() - feeder._lastResponded) / 1000) <= 30),
  };
};

FeederCoordinator.prototype.setDefaultQuantity = function (identifier, quantity, callback) {
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
