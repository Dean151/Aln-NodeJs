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
  const bodyParser = require('body-parser');

  // Create a service (the app object is just a callback).
  var app = express();

  app.use(bodyParser.urlencoded({ extended: true }));
  app.use(bodyParser.json());

  // Create the routes for the API
  var router = express.Router();

  router.use(function(req, res, next) {

    // Check the request header token to validate we're not messing around
    if (config.api_secret != req.headers['x-access-token']) {
      res.status(403);
      res.json({ success: false, error: 'Authentication needed.'})
      // We return to prevent to go to next step
      return;
    }

    // Check that the feeder is in the allowed feeders list
    else if (!config.allowed_feeders.includes(req.body.identifier)) {
      res.status(403);
      res.json({ success: false, error: 'Unrecognized feeder identifier.'})
      // We return to prevent to go to next step
      return;
    }

    // Make sure we go to the next routes and don't stop here
    else {
      next();
    }
  });

  router.route('/quantity')
  .get(function(req, res) {
    try {
      var quantity = feederCoordinator.getDefaultQuantity(req.body.identifier, (quantity) => {
        res.json({ success: true, quantity: quantity });
      });
    }
    catch(error) {
      res.status(400);
      res.json({ success: false, error: error});
    }
  })
  .post(function(req, res) {
    try {
      const Quantity = require("./quantity");
      var quantity = new Quantity(req.body.quantity);
      feederCoordinator.setDefaultQuantity(req.body.identifier, quantity, function(msg) {
        if (msg == 'success') {
          res.json({ success: true, message: 'Quantity successfully setted!' });
        }
        else {
          res.status(400);
          res.json({ success: false, error: msg });
        }
      });
    }
    catch(error) {
      res.status(400);
      res.json({ success: false, error: error});
    }
  });

  router.route('/planning')
  .get(function(req, res) {
    try {
      var planning = feederCoordinator.getPlanning(req.body.identifier, (planning) => {
        res.json({ success: true, planning: planning });
      });
    }
    catch(error) {
      res.status(400);
      res.json({ success: false, error: error});
    }
  })
  .post(function(req, res) {
    try {
      const Meal = require('./meal');
      var meals = req.body.meals.map((obj) => { return new Meal(obj.time, obj.quantity); });
      const Planning = require("./planning");
      var planning = new Planning(meals);
      feederCoordinator.setPlanning(req.body.identifier, planning, function(msg) {
        if (msg == 'success') {
          res.json({ success: true, message: 'Quantity successfully setted!' });
        }
        else {
          res.status(400);
          res.json({ success: false, error: msg });
        }
      });
    }
    catch(error) {
      res.status(400);
      res.json({ success: false, error: error});
    }
  });

  router.route('/feed').post(function(req, res) {
    try {
      const Quantity = require("./quantity");
      var quantity = new Quantity(req.body.quantity);
      feederCoordinator.feedNow(req.body.identifier, quantity, function(msg) {
        if (msg == 'success') {
          res.json({ success: true, message: 'Feeding completed!' });
        }
        else {
          res.status(400);
          res.json({ success: false, error: msg });
        }
      });
    }
    catch(error) {
      res.status(400);
      res.json({ success: false, error: error});
    }
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
