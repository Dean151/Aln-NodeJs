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

const ResponseBuilder = require('../response-builder');
const Quantity = require("./quantity");

class Emulator {

  constructor (identifier, host, port, isEmpty = false) {

    this.isEmpty = isEmpty;
    const client = new net.Socket();

    client.connect(port, host, () => {
      // Client is supposed to identify itself, in order to get the timestamp from official server
      setInterval(() => {
        client.write(ResponseBuilder.feederIdentification(identifier));
      }, 10000);
    });

    client.on('data', (data) => {
      // Client need to respond to different sets of order
      // to make the API knows that the request has been processed
      let hexData = data.toString('hex');

      // Current time from alnpet
      if (hexData.match(/^9da10601([0-9a-f]+)$/)) {
        console.log('Time received from server', hexData.replace('9da10601', ''));
      }
      // Setting default amount
      else if (hexData.match(/^9da106c3([0-9a-f]+)$/)) {
        client.write(ResponseBuilder.changeDefaultQuantityExpectation(identifier));
      }
      // Feeding now
      else if (hexData.match(/^9da106a2([0-9a-f]+)$/)) {
        client.write(ResponseBuilder.feedNowExpectation(identifier));
        if (this.isEmpty) {
          let amount = parseInt(hexData.replace(/^9da106a2/, ''), 16);
          let quantity = new Quantity(amount);
          setTimeout(() => {
            client.write(ResponseBuilder.emptyFeederSignal(identifier, quantity));
          }, 3000);
        }
      }
      // Changing plan
      else if (hexData.match(/^9da12dc4([0-9a-f]+)$/)) {
        client.write(ResponseBuilder.changePlanningExpectation(identifier));
      }
      else {
        // Unknown response. Log it
        console.log('Unknown data received by emulator: ' + hexData);
      }
    });

  }

}

module.exports = Emulator;
