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

const express = require('express');
const bodyParser = require('body-parser');
const http = require('http');

const Quantity = require("./quantity");
const Meal = require("./meal");
const Planning = require("./planning");

function Server(feederCoordinator, databaseCoordinator, config) {

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
      res.json({ success: false, error: 'Authentication token required.'});
    }
    else {
      next();
    }
  });

  router.use((req, res, next) => {
    // Identifier is not an option any more
    if (typeof req.body.identifier === 'undefined') {
      throw 'No feeder identifier given';
    }
    else {
      next();
    }
  });

  router.use((err, req, res, next) => {
    res.status(500);
    res.json({ success: false, error: err.toString() });
  });

  router.route('/feeders').post((req, res) => {
    let feeders = feederCoordinator.getFeeder(req.body.identifier);
    res.json(feeders);
  });

  router.route('/quantity').put((req, res) => {
    let quantity = new Quantity(req.body.quantity);
    feederCoordinator.setDefaultQuantity(req.body.identifier, quantity, (msg) => {
      if (msg !== 'success') {
        throw msg;
      }
      res.json({ success: true });
    });
  });

  router.route('/planning').post((req, res) => {
    // Fetch the planning if it's exists
    databaseCoordinator.getCurrentPlanning(req.body.identifier, (planning) => {
      if (typeof planning === 'undefined') {
        throw 'No planning';
      }
      res.json({ success: true, meals: planning.jsoned() });
    });
  });

  router.route('/planning').put((req, res) => {
    let meals = req.body.meals.map((obj) => { return new Meal(obj.time, obj.quantity, obj.enabled); });
    let planning = new Planning(meals);
    feederCoordinator.setPlanning(req.body.identifier, planning, (msg) => {
      if (msg !== 'success') {
        throw msg;
      }
      res.json({ success: true });
    });
  });

  router.route('/feed').put((req, res) => {
    let quantity = new Quantity(req.body.quantity);
    feederCoordinator.feedNow(req.body.identifier, quantity, (msg) => {
      if (msg !== 'success') {
        throw msg;
      }
      res.json({ success: true });
    });
  });

  router.route('/push_token')
    .post((req, res) => {
      if (!req.body.type) {
        res.status(400);
        res.json({ success: false, error: 'Push notification type required.'});
      }
      else if (!req.body.token) {
        res.status(400);
        res.json({ success: false, error: 'Push notification token required.'});
      }
      else {
        databaseCoordinator.registerPushToken(req.body.identifier, req.body.type, req.body.token, () => {
          res.json({ success: true });
        });
      }
    })
    .put((req, res) => {
      if (!req.body.old_token) {
        res.status(400);
        res.json({ success: false, error: 'Push notification old token required.'});
      }
      else if (!req.body.token) {
        res.status(400);
        res.json({ success: false, error: 'Push notification token required.'});
      }
      else {
        databaseCoordinator.updatePushToken(req.body.old_token, req.body.token, () => {
          res.json({ success: true });
        });
      }
    })
    .delete((req, res) => {
      if (!req.body.type) {
        res.status(400);
        res.json({ success: false, error: 'Push notification type required.'});
      }
      else {
        databaseCoordinator.deletePushTokens(req.body.identifier, req.body.type, () => {
          res.json({ success: true });
        });
      }
    });

  // Use the routes
  app.use('/api', router);

  http.createServer(app).listen(config.local_port, 'localhost');
}
module.exports = Server;
