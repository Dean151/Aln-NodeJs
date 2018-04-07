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

  // Create the routes for the API
  var router = express.Router();

  var router.route('/amount').post(function(req, res) {
    console.log(req);
    console.log(res);
  });

  // Use the routes
  app.use('/api', router);

  if (config.use_https) {
    const fs = require('fs');
    const minTlsVersion = require('minimum-tls-version');
    var options = {
      key: fs.readFileSync(config.certificate_key),
      cert: fs.readFileSync(config.certificate),
      ca: fs.readFileSync(config.ca_certificate),
      secureOptions: minTlsVersion('tlsv11')
    };

    // Adding HSTS
    const hsts = require('hsts')
    app.use(hsts({
      maxAge: 15552000,        // Must be at least 1 year to be approved
      includeSubDomains: true, // Must be enabled to be approved
      preload: true
    }));

    // Create an HTTPS service identical to the HTTP service.
    const https = require('https');
    const server = https.createServer(options, app).listen(config.server_port);

    // Allowing TLS session resume
    const strongClusterTlsStore = require('strong-cluster-tls-store');
    strongClusterTlsStore(server);
  }
  else {
    const http = require('http');

    // Create an HTTP service.
    http.createServer(app).listen(config.server_port);
  }

}

module.exports = Server;
