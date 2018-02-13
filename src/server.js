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

function Server(feederCoordinator, config) {
  this.feederCoordinator = feederCoordinator;

  const express = require('express');

  // Create a service (the app object is just a callback).
  var app = express();

  if (config.use_https) {
    const https = require('https');
    const fs = require('fs');

    // This line is from the Node.js HTTPS documentation.
    var options = {
      key: fs.readFileSync(config.certificate_key),
      cert: fs.readFileSync(config.certificate),
      ca: fs.readFileSync(config.ca_certificate)
    };

    // Create an HTTPS service identical to the HTTP service.
    https.createServer(options, app).listen(443);
  }
  else {
    const http = require('http');

    // Create an HTTP service.
    http.createServer(app).listen(80);
  }

}

module.exports = Server;
