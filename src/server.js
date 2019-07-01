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
const request = require('request');
const session = require('express-session');
const MySQLStore = require('express-mysql-session')(session);
const helmet = require('helmet');
const bodyParser = require('body-parser');
const cacheControl = require('express-cache-controller');

const validator = require('validator');

const CryptoHelper = require('./crypto-helper');
const Quantity = require("./models/quantity");
const Meal = require("./models/meal");
const Planning = require("./models/planning");

class HttpError extends Error {
  constructor(message, code = 500) {
    super(message);
    this.code = code;
  }
}

class Server {

  /**
   * @param {{base_url: string, local_port: number, session_name: string, session_secret: string, hmac_secret: string, mysql_host: string, mysql_user: string, mysql_password: string, mysql_database: string, ios_bundle_identifier: string, ios_team_identifier: string, key_id: string, key_path: string, ios_app_identifier: string}} config
   * @param {FeederCoordinator} feederCoordinator
   * @param {DataBaseCoordinator} database
   */
  constructor(config, feederCoordinator, database) {

    // Create a service (the app object is just a callback).
    let app = express();

    // Use helmet for better security & obfuscation settings
    app.use(helmet());

    // And the session mechanism
    app.use(session({
      key: config.session_name,
      secret: config.session_secret,
      store: new MySQLStore({
        host: config.mysql_host,
        user: config.mysql_user,
        password: config.mysql_password,
        database: config.mysql_database
      }),
      resave: false,
      saveUninitialized: false,
      cookie: { secure: 'auto' }
    }));

    // Create the routes for the API
    let api = Server.createApiRouter(feederCoordinator, database, config);
    app.use('/api', api);

    app.set('view engine', 'pug');

    let web = Server.createWebRouter(config);
    app.use('/', web);

    http.createServer(app).listen(config.local_port, 'localhost');
  }

  /**
   *
   * @param {{ios_app_identifier: string}} config
   * @return {Router}
   */
  static createWebRouter(config) {
    let web = express.Router();

    if (config.ios_app_identifier) {
      // We also have an apple-app-site-association application
      let association = {
        webcredentials: {
          apps: [config.ios_app_identifier]
        },
        applinks: {
          apps: [],
          details: [{
            appID: config.ios_app_identifier,
            paths:['*']
          }]
        }
      };
      web.all('/apple-app-site-association', (req, res, next) => {
        res.json(association);
      });
    }

    // Error handling at the end
    web.use((err, req, res, next) => {
      if (err instanceof HttpError) {
        res.status(err.code);
      }
      else {
        res.status(500);
      }
      res.render('errors', { error: err });
    });

    return web;
  }

  /**
   * @param {FeederCoordinator} feederCoordinator
   * @param {DataBaseCoordinator} database
   * @param {{base_url: string, hmac_secret: string, ios_bundle_identifier: string, ios_team_identifier: string, key_id: string, key_path: string }} config
   * @return {Router}
   */
  static createApiRouter(feederCoordinator, database, config) {
    let api = express.Router();

    api.use(bodyParser.urlencoded({ extended: true }));
    api.use(bodyParser.json());
    api.use(cacheControl({ noCache: true }));

    let requiresNotLoggedIn = (req, res, next) => {
      if (req.session && req.session.user) {
        throw new HttpError( 'Already logged-in', 403);
      }
      next();
    };

    /** AUTHENTICATION MECHANISMS **/

    api.post('/user/login', requiresNotLoggedIn, (req, res, next) => {
      if (!req.body.appleId || !req.body.authorizationCode || !req.body.identityToken) {
        throw new HttpError('Missing appleId, authorizationCode or identityToken', 400);
      }

      let logUser = (user) => {
        database.loggedUser(user.id).then(() => {
          req.session.user = user.jsoned();
          let token = CryptoHelper.hashBase64('csrf', req.session.id + config.hmac_secret);
          res.json({ success: true, user: req.session.user, token: token });
        }).catch(next);
      };

      let logAppleIdUser = (apple_id) => {
        database.getUserByAppleId(apple_id).then((user) => {
          if (user === undefined) {
            // We create a user here
            let data = {
              apple_id: req.body.apple_id,
              email: validator.normalizeEmail(req.body.email),
              shown_email: req.body.email,
            };
            Promise.all([database.createUser(data), database.getUserByAppleId(req.body.apple_id)]).then((results) => {
              let user = results[1];
              if (!user) {
                throw new HttpError('Registration failed', 500);
              }
              logUser(user);
            }).catch(next);
            return;
          }
          logUser(user);
        }).catch(next);
      };

      // Fetch Apple's public key
      this.fetchApplePublicKey().then((key) => {
        let idToken = Buffer.from(req.body.identityToken, 'base64').toString('utf8');
        // Will throw if identityToken is not okay
        CryptoHelper.checkAppleToken(key, idToken, config.ios_bundle_identifier);
        // Validate authorization code
        this.validateAppleAuthToken(req.body.authorizationCode, config).then((auth) => {
          console.log(auth);
          // TODO!
          logAppleIdUser(req.body.apple_id);
        }).catch(next);
      }).catch(next);
    });

    api.post('/user/check', (req, res, next) => {
      if (!req.session || !req.session.user) {
        res.json({ state: 'not logged in', user: null });
        return;
      }

      database.getUserById(req.session.user.id).then( (user) => {
        if (user === undefined) {
          req.session.destroy(function(err) {
            res.json({ state: 'not logged in', user: null });
          });
          return;
        }

        // Update the user object
        req.session.user = user.jsoned();
        let token = CryptoHelper.hashBase64('csrf', req.session.id + config.hmac_secret);
        res.json({ state: 'logged in', user: req.session.user, token: token });
      }).catch(next);
    });

    // Every endpoint below requires login-in
    api.use((req, res, next) => {
      if (!req.session || !req.session.user) {
        throw new HttpError('Not logged-in', 403);
      }
      next();
    });

    // CSRF Protection
    api.use((req, res, next) => {
      if (req.method === 'GET' || req.method === 'HEAD' || req.method === 'OPTIONS' || req.method === 'TRACE') {
        next();
        return;
      }

      let csrf = true;
      if (CryptoHelper.checkBase64Hash('csrf', req.body._csrf, req.session.id + config.hmac_secret)) {
        csrf = false;
      } else if (CryptoHelper.checkBase64Hash('csrf', req.headers['x-csrf-token'], req.session.id + config.hmac_secret)) {
        csrf = false;
      }

      if (csrf) {
        throw new HttpError('CSRF token check failed', 403);
      }
      next();
    });

    // Logging out
    api.post('/user/logout', (req, res, next) => {
      // delete session object
      req.session.destroy(function(err) {
        if (err) {
          next(err);
        }
        res.json({ success: true });
      });
    });


    /** FEEDER HANDLING **/

    api.post('/feeder/claim', (req, res, next) => {
        if (typeof req.body.identifier === 'undefined') {
          throw new HttpError('No feeder identifier given', 400);
        }

        // THIS DOES NOT WORK since we have the nginx proxy making it always 127.0.0.1
        let ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
        if (!validator.isIP(ip)) {
          throw new HttpError('Feeder not found', 404);
        }

        database.claimFeeder(req.body.identifier, req.session.user.id, ip).then((success) => {
          if (!success) {
            throw new HttpError('Feeder not found', 404);
          }
          res.json({ success: true });
        }).catch(next);
      });

    // We now need to check feeder association
    api.use((req, res, next) => {
      let id = req.path.split('/')[2];
      if (isNaN(+id)) {
        throw new HttpError('No feeder id given', 400);
      }

      database.checkFeederAssociation(id, req.session.user.id).then((feeder) => {
        if (!feeder) {
          throw new HttpError('Feeder not found', 404);
        }

        req.feeder = feeder;
        next();
      }).catch(next);
    });

    api.get('/feeder/:id', (req, res, next) => {
      feederCoordinator.getFeeder(req.feeder.identifier).then((feeder) => {
        if (!feeder) {
          throw new HttpError('Feeder not found', 404);
        }
        res.json(feeder.jsoned());
      }).catch(next);
    });

    api.put('/feeder/:id', (req, res, next) => {
      let name = req.body.name;
      database.setFeederName(req.feeder.id, name).then((success) => {
        res.json({ success: success });
      }).catch(next);
    });

    api.get('/feeder/:id/meals', (req, res, next) => {
      database.getMealHistory(req.feeder.id, req.query.period, req.query.offset).then((meals) => {
        res.json(meals);
      }).catch(next);
    });

    api.post('/feeder/:id/feed', (req, res, next) => {
      let quantity = new Quantity(req.body.quantity);
      feederCoordinator.feedNow(req.feeder.identifier, quantity).then(() => {
        res.json({ success: true });
      }).catch(next);
    });

    api.put('/feeder/:id/quantity', (req, res, next) => {
      let quantity = new Quantity(req.body.quantity);
      feederCoordinator.setDefaultQuantity(req.feeder.identifier, quantity).then(() => {
        res.json({ success: true });
      }).catch(next);
    });

    api.route('/feeder/:id/planning')
      .get((req, res, next) => {
        // Fetch the planning if it's exists
        database.getCurrentPlanning(req.feeder.id).then((planning) => {
          if (planning === undefined) {
            throw new HttpError('No planning found', 404);
          }
          res.json({ success: true, meals: planning.jsoned() });
        }).catch(next);
      })
      .put((req, res, next) => {
        let meals = req.body.meals.map((obj) => { return new Meal(obj.time, obj.quantity, obj.enabled); });
        let planning = new Planning(meals);
        feederCoordinator.setPlanning(req.feeder.identifier, planning).then(() => {
          res.json({ success: true });
        }).catch(next);
      });

    // Error handling at the end
    api.use((err, req, res, next) => {
      if (err instanceof HttpError) {
        console.log('Error: ' + err.message);
        res.status(err.code);
        res.json({ success: false, message: err.message });
        return;
      }

      if (err instanceof Error) {
        console.log('Error: ' + err.message);
        res.status(500);
        res.json({ success: false, message: err.message });
        return;
      }

      console.log('Error: ' + err);
      res.status(500);
      res.json({ success: false, error: err });
    });

    return api;
  }

  /**
   * @return {Promise<any>}
   */
  static fetchApplePublicKey() {
    return new Promise((resolve, reject) => {
      request('https://appleid.apple.com/auth/keys', { json: true }, (err, res, body) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(body.keys[0]);
      });
    });
  }

  /**
   * @param code
   * @param {{ base_url: string, ios_bundle_identifier: string, ios_team_identifier: string, key_id: string, key_path: string}} config
   * @return {Promise<any>}
   */
  static validateAppleAuthToken(code, config) {
    let secret = CryptoHelper.getAppleClientSecret(config);
    let data = {
      client_id: config.ios_bundle_identifier,
      client_secret: secret,
      refresh_token: code,
      grant_type: 'refresh_token.',
    };
    console.log('secret: ' + secret);
    return new Promise((resolve, reject) => {
      request.post('https://appleid.apple.com/auth/token', { form: data }, (error, res, body) => {
        if (error) {
          console.log(error);
          reject(error);
          return;
        }
        console.log(body);
        resolve(body);
      });
    });
  }
}

module.exports = Server;
