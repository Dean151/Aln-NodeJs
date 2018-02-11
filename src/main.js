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

const ResponseBuilder = require("./response-builder");
const FeederCoordinator = require("./feeder-coordinator");
var feederCoordinator = new FeederCoordinator();

const net = require("net");
const server = net.createServer((c) => {
  console.log('Client connected');
  c.on('end', () => {
    console.log('Client disconnected');
  });
  c.on('data', (data) => {
    var hexData = data.toString('hex');
    console.log('Data received: ' + hexData);
    if (hexData.startsWith('9da1') && hexData.endsWith('d0010000')) {
      // It's an feeder identifier
      var hexIdentifier = hexData.replace(/^9da1([0-9a-f]+)d0010000$/, "$1");
      var identifier = new Buffer(hexIdentifier, 'hex').toString();
      console.log('Feeder identified with: ' + identifier);

      // Register it
      feederCoordinator.registerFeeder(identifier, c);

      // Send it back the time
      feederCoordinator.write(identifier, ResponseBuilder.time());
    }
  });
  c.pipe(c);
});

server.on('error', (err) => {
  console.log('Error occurred: ' + err);
});

// Listen port 1032 ; that will be called by device
server.listen(1032, "192.168.1.1", () => {
  console.log('Listening to 192.168.1.1:1032');
});
