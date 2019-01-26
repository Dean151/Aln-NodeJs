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

const net = require('net');

const Feeder = require("./models/feeder");
const ResponseBuilder = require("./response-builder");
const Time = require("./models/time");
const Quantity = require("./models/quantity");

class FeederCoordinator {

  /**
   * @param {{feeder_port: number, feeder_list: string[]|undefined, feeder_mode: string|undefined}} config
   * @param {DataBaseCoordinator} database
   */
  constructor(config, database) {

    /**
     * @type {Object.<string, Feeder>}
     */
    this.feeders = {};
    this.database = database;

    const server = net.createServer((socket) => {
      this.handleSocketConnection(socket, config);
    });

    server.on('error', (err) => {
      console.log('Error occurred: ' + err);
    });

    // Listen on given port ; that will be called by device
    server.listen(config.feeder_port, () => {
      console.log('Listening to port', config.feeder_port);
    });

  }

  /**
   * @param {net.Socket} socket
   * @param {{feeder_list: string[]|undefined, feeder_mode: string|undefined}} config
   */
  handleSocketConnection (socket, config) {
    
    // TODO: filter only with IP from registering process

    let ip = socket.remoteAddress + ":" + socket.remotePort;
    console.log('Client connected:', ip);
    socket.on('end', () => {
      console.log('Client disconnected:', ip);
    });
    socket.on('data', (data) => {
      this.socketDataRetreived(data, ip, socket);
    });
  }

  /**
   * @param {Buffer} data
   * @param {string} ip
   * @param {net.Socket} socket
   */
  socketDataRetreived (data, ip, socket) {
    console.log('Data received from', ip, ':', data.toString('hex'));

    try {
      let treatedData = ResponseBuilder.recognize(data);
      switch (treatedData.type) {
        case 'identification':
          this.identifyFeeder(treatedData.identifier, ip, socket);
          break;
        case 'manual_meal':
          let quantity = new Quantity(treatedData.amount);
          this.recordManualMeal(treatedData.identifier, quantity);
          break;
        case 'empty_feeder':
          let time = new Time(treatedData.hours, treatedData.minutes);
          let plannedQuantity = new Quantity(treatedData.amount);
          this.recordEmptyFeeder(treatedData.identifier, time, plannedQuantity);
          break;
        case 'expectation':
          break;
        default:
          throw 'Untreated response type';
      }
    }
    catch (e) {
      this.database.logUnknownData(e.message ? e.message : e, data, ip);
      socket.destroy();
    }
  }

  /**
   * @param {string} identifier
   * @param {string} ip
   * @param {net.Socket} socket
   * @throws
   */
  identifyFeeder (identifier, ip, socket) {
    console.log('Feeder identified with', identifier);

    if (this.feeders[identifier] === undefined) {
      this.feeders[identifier] = new Feeder(identifier, socket);
    }
    else {
      this.feeders[identifier].hasResponded(socket);
    }

    // Send it back the time
    this.send(identifier, ResponseBuilder.time(), () => {});

    // Maintain the connection with the socket
    socket.setKeepAlive(true, 30000);

    // Register it in database
    this.database.registerFeeder(identifier, ip);
  }

  /**
   * @param {String} identifier
   * @param {Quantity} quantity
   * @throws
   */
  recordManualMeal (identifier, quantity) {
    this.database.recordMeal(identifier, quantity);
    this.database.rememberDefaultAmount(identifier, quantity);
  }

  /**
   * @param {String} identifier
   * @param {Time} time
   * @param {Quantity} quantity
   * @throws
   */
  recordEmptyFeeder (identifier, time, quantity) {
    // TODO: Later, push notification sending?
    let data = {
      hours: time.hours,
      minutes: time.minutes,
      amount: quantity.amount
    };
    this.database.logAlert(identifier, 'empty', data);
  }

  /**
   * @param {string} identifier
   * @param {Buffer} data
   * @param {Feeder~sendCallback} callback
   * @throws
   */
  send (identifier, data, callback) {
    if (!(identifier in this.feeders)) {
      throw 'Feeder not found';
    }
    this.feeders[identifier].send(data, callback);
  }

  /**
   * @param {string} identifier
   * @param {Buffer} data
   * @param {Buffer} expectation
   * @param {FeederCoordinator~sendAndExpectCallback} callback
   * @throws
   */
  sendAndExpect (identifier, data, expectation, callback) {
    if (!(identifier in this.feeders)) {
      throw 'Feeder not found';
    }
    let feeder = this.feeders[identifier];

    // Prepare a timeout for execution
    let timeout = setTimeout(() => {
      feeder.socket.removeListener('data', expectationListener);
      callback('timeout');
    }, 30000);

    let expectationListener = (data) => {
      if (data.toString('hex') === expectation.toString('hex')) {
        if (typeof callback === 'function') {
          callback('success');
        }
        feeder.socket.removeListener('data', expectationListener);
        clearTimeout(timeout);
      }
    };

    // Listen for the expectation
    feeder.socket.on('data', expectationListener);

    // Write to the feeder
    feeder.send(data, () => {
      console.log('Waiting for expectation ...');
    });
  }

  /**
   * @callback FeederCoordinator~getFeederCallback
   * @param {Feeder|undefined} feeder
   * @throws
   */

  /**
   * @param {string} identifier
   * @param {FeederCoordinator~getFeederCallback} callback
   * @throws
   */
  getFeeder (identifier, callback) {
    if (identifier in this.feeders) {
      callback(this.feeders[identifier]);
    }

    // Feeder is unreachable. Let try to get it from database
    this.database.fetchFeederLastResponded(identifier, (lastResponded) => {
      callback(lastResponded ? new Feeder(identifier, lastResponded) : undefined);
    });
  }

  /**
   * @param {String} identifier
   * @param {Quantity} quantity
   * @param {FeederCoordinator~sendAndExpectCallback} callback
   * @throws
   */
  setDefaultQuantity (identifier, quantity, callback) {
    let data = ResponseBuilder.changeDefaultQuantity(quantity);
    let expectation = ResponseBuilder.changeDefaultQuantityExpectation(identifier);

    this.sendAndExpect(identifier, data, expectation, (msg) => {
      this.database.rememberDefaultAmount(identifier, quantity);
      callback(msg);
    });
  }


  /**
   * @param {String} identifier
   * @param {Planning} planning
   * @param {FeederCoordinator~sendAndExpectCallback} callback
   * @throws
   */
  setPlanning (identifier, planning, callback) {
    let data = ResponseBuilder.changePlanning(planning);
    let expectation = ResponseBuilder.changePlanningExpectation(identifier);

    this.sendAndExpect(identifier, data, expectation, (msg) => {
      this.database.recordPlanning(identifier, planning);
      callback(msg);
    });
  }

  /**
   * @param {String} identifier
   * @param {Quantity} quantity
   * @param {FeederCoordinator~sendAndExpectCallback} callback
   * @throws
   */
  feedNow (identifier, quantity, callback) {
    let data = ResponseBuilder.feedNow(quantity);
    let expectation = ResponseBuilder.feedNowExpectation(identifier);

    this.sendAndExpect(identifier, data, expectation, (msg) => {
      this.database.recordMeal(identifier, quantity);
      callback(msg);
    });
  }

  /**
   * @callback FeederCoordinator~sendAndExpectCallback
   * @param {string} msg
   */
}

module.exports = FeederCoordinator;