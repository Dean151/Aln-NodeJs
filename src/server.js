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

function Server(feederCoordinator, databaseCoordinator, config) {

  const express = require('express');
  const bodyParser = require('body-parser');

  // Create a service (the app object is just a callback).
  let app = express();

  app.use(bodyParser.urlencoded({ extended: true }));
  app.use(bodyParser.json());

  // Create the routes for the API
  let router = express.Router();

  router.use((req, res, next) => {

    // Check the request header token to validate we're not messing around
    if (config.api_secret !== req.headers['x-access-token']) {
      res.status(403);
      res.json({ success: false, error: 'Authentication needed.'});
    }

    // Check that the feeder is in the allowed feeders list
    else if (typeof req.body.identifier !== 'undefined' && config.allowed_feeders.length && !config.allowed_feeders.includes(req.body.identifier)) {
      res.status(403);
      res.json({ success: false, error: 'Non-authorized feeder identifier.'});
    }

    // Make sure we go to the next routes and don't stop here
    else {
      next();
    }
  });

  router.route('/feeders').post((req, res) => {
    try {
      let feeders = feederCoordinator.getFeeders();
      res.json(feeders);
    }
    catch(error) {
      res.status(400);
      res.json({ success: false, error: error.toString() });
    }
  });

  router.route('/quantity').put((req, res) => {
    try {
      const Quantity = require("./quantity");
      let quantity = new Quantity(req.body.quantity);
      feederCoordinator.setDefaultQuantity(req.body.identifier, quantity, (msg) => {
        if (msg === 'success') {
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
      res.json({ success: false, error: error.toString() });
    }
  });

  router.route('/planning').post((req, res) => {
    try {
      // Fetch the planning if it's exists
      databaseCoordinator.getCurrentPlanning(req.body.identifier, (planning, err) => {
        if (typeof planning === 'undefined') {
          throw err;
        }
        res.json({ success: true, meals: planning.jsoned() });
      });
    }
    catch(error) {
      res.status(400);
      res.json({ success: false, error: error.toString() });
    }
  });

  router.route('/planning').put((req, res) => {
    try {
      const Meal = require('./meal');
      let meals = req.body.meals.map((obj) => { return new Meal(obj.time, obj.quantity); });
      const Planning = require("./planning");
      let planning = new Planning(meals);
      feederCoordinator.setPlanning(req.body.identifier, planning, (msg) => {
        if (msg === 'success') {
          res.json({ success: true, message: 'Planning successfully setted!' });
        }
        else {
          res.status(400);
          res.json({ success: false, error: msg });
        }
      });
    }
    catch(error) {
      res.status(400);
      res.json({ success: false, error: error.toString() });
    }
  });

  router.route('/feed').put((req, res) => {
    try {
      const Quantity = require("./quantity");
      let quantity = new Quantity(req.body.quantity);
      feederCoordinator.feedNow(req.body.identifier, quantity, (msg) => {
        if (msg === 'success') {
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
      res.json({ success: false, error: error.toString() });
    }
  });

  // Use the routes
  app.use('/api', router);

  const http = require('http');
  http.createServer(app).listen(config.local_port, 'localhost');
}
module.exports = Server;
