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

'use strict'

var net = require('net');
var console = require('console-prefix');

var Time = require('./time.js');

var server = net.createServer(function(socket) {
    socket.on('data', function(data) {
      console.log('Received data: ' + data.toString('hex'));

      if (data.length == 20) {
        var identifier_data = data.slice(2, 16);
        // Todo: use identifier later

        var connect_prefix = new Buffer([157, 161, 6, 1]);
        var time = new Time();
        var connect_response = Buffer.concat([connect_prefix, time.buffered()]);
        socket.write(connect_response.toString('hex'), 'hex', function() {
          console.log('Sent data: ' + connect_response.toString('hex'));
        });
      }
    });
});

// Listen port 1032 ; that will be called by device
server.listen(1032, '192.168.1.1');
