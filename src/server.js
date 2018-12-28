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

const http = require('http');
const express = require('express');
const helmet = require('helmet');
const bodyParser = require('body-parser');

const Quantity = require("./models/quantity");
const Meal = require("./models/meal");
const Planning = require("./models/planning");

class Server {

  /**
   * @param {{local_port: number, api_secret: string}} config
   * @param {FeederCoordinator} feederCoordinator
   * @param {DataBaseCoordinator} database
   */
  constructor(config, feederCoordinator, database) {

    // Create a service (the app object is just a callback).
    let app = express();

    // Use helmet for better security & obfuscation settings
    app.use(helmet());

    // Create the routes for the API
    let api = this.createApiRouter(config, feederCoordinator, database);

    // Use the routes
    app.use('/api', api);

    http.createServer(app).listen(config.local_port, 'localhost');
  }

  /**
   * @param {{api_secret: string}} config
   * @param {FeederCoordinator} feederCoordinator
   * @param {DataBaseCoordinator} database
   * @return {express.Router}
   */
  createApiRouter(config, feederCoordinator, database) {
    let api = express.Router();

    api.use(bodyParser.urlencoded({ extended: true }));
    api.use(bodyParser.json());

    api.use((req, res, next) => {
      // Check the request header token to validate we're not messing around
      if (config.api_secret !== req.headers['x-access-token']) {
        res.status(403);
        res.json({ success: false, error: 'Authentication token needed.'});
      }
      else {
        next();
      }
    });

    api.use((req, res, next) => {
      // Identifier is not an option any more
      if (typeof req.body.identifier === 'undefined') {
        throw 'No feeder identifier given';
      }
      else {
        next();
      }
    });

    api.use((err, req, res, next) => {
      res.status(500);
      res.json({ success: false, error: err.toString() });
    });

    api.route('/feeders').post((req, res) => {
      let feeders = feederCoordinator.getFeeder(req.body.identifier);
      res.json(feeders);
    });

    api.route('/quantity').put((req, res) => {
      let quantity = new Quantity(req.body.quantity);
      feederCoordinator.setDefaultQuantity(req.body.identifier, quantity, (msg) => {
        if (msg !== 'success') {
          throw msg;
        }
        res.json({ success: true });
      });
    });

    api.route('/planning').post((req, res) => {
      // Fetch the planning if it's exists
      database.getCurrentPlanning(req.body.identifier, (planning) => {
        if (typeof planning === 'undefined') {
          throw 'No planning';
        }
        res.json({ success: true, meals: planning.jsoned() });
      });
    });

    api.route('/planning').put((req, res) => {
      let meals = req.body.meals.map((obj) => { return new Meal(obj.time, obj.quantity, obj.enabled); });
      let planning = new Planning(meals);
      feederCoordinator.setPlanning(req.body.identifier, planning, (msg) => {
        if (msg !== 'success') {
          throw msg;
        }
        res.json({ success: true });
      });
    });

    api.route('/feed').put((req, res) => {
      let quantity = new Quantity(req.body.quantity);
      feederCoordinator.feedNow(req.body.identifier, quantity, (msg) => {
        if (msg !== 'success') {
          throw msg;
        }
        res.json({ success: true });
      });
    });

    return api;
  }
}

module.exports = Server;
