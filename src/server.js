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

class Server {

  /**
   * @param {{base_url: string, local_port: number, session_name: string, session_secret: string, hmac_secret: string, mysql_host: string, mysql_user: string, mysql_password: string, mysql_database: string}} config
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

    let web = Server.createWebRouter(config);
    app.use('/', web);

    http.createServer(app).listen(config.local_port, 'localhost');
  }

  static createWebRouter(config) {
    let web = express.Router();

    web.route(['/user/create_password/\d+/\d+/[a-zA-Z0-9\-_]+', '/user/reset_password/\d+/\d+/[a-zA-Z0-9\-_]+']).get((req, res, next) => {
      // TODO: show a page that would redirect to the application.
      // Or eventually explain to open the link on the iOS device.
    });

    if (config.ios_appname) {
      // We also have an apple-app-site-association application
      let association = {
        webcredentials: {
          apps: [config.ios_appname]
        },
        applinks: {
          apps: [],
          details: [{
            appID: config.ios_appname,
            paths:['/user/create_password/*', '/user/reset_password/*']
          }]
        }
      };
      web.all('/apple-app-site-association', (req, res, next) => {
        res.json(association);
      });
    }

    return web;
  }

  /**
   * @param {FeederCoordinator} feederCoordinator
   * @param {DataBaseCoordinator} database
   * @param {{base_url: string, hmac_secret: string}} config
   * @return {express.Router}
   */
  static createApiRouter(feederCoordinator, database, config) {
    let api = express.Router();

    api.use(bodyParser.urlencoded({ extended: true }));
    api.use(bodyParser.json());
    api.use(cacheControl({ noCache: true }));

    let requiresNotLoggedIn = (req, res, next) => {
      if (req.session && req.session.user) {
        res.status(403);
        res.json({ success: false, error: 'Already logged-in as ' + req.session.user.email });
      } else {
        next();
      }
    };

    /** AUTHENTICATION MECHANISMS **/

    api.post('/user/register', requiresNotLoggedIn, (req, res) => {
      if (!req.body.email) {
        throw 'Missing email';
      }

      if (!validator.isEmail(req.body.email)) {
        res.status(401);
        res.json({ success: false, error: 'Not an email' });
        return;
      }

      // Check if the user already exists
      let email = validator.normalizeEmail(req.body.email);
      database.getUserByEmail(email, (user) => {
        if (user) {
          res.status(406);
          res.json({ success: false, error: 'Email already in use' });
          return;
        }

        database.createUser({
          email: email,
          hash: 'not-an-hash',
        }, (success) => {
          if (!success) {
            res.status((500));
            res.json({ success: false, error: 'Registration failed' });
            return;
          }

          database.getUserByEmail(email, (user) => {
            if (!user) {
              res.status((500));
              res.json({ success: false, error: 'Registration failed' });
              return;
            }

            user.sendResetPassMail(config);
            res.json({ success: true });
          });
        });
      });
    });

    api.post('/user/login', requiresNotLoggedIn, (req, res) => {
      if (!req.body.email || !req.body.password) {
        throw 'Missing email or password';
      }
      let email = validator.normalizeEmail(req.body.email);
      database.getUserByEmail(email, (user) => {
        if (typeof user === 'undefined') {
          res.status(401);
          res.json({ success: false, error: 'Wrong email/password' });
          return;
        }

        CryptoHelper.comparePassword(req.body.password, user.password, (err, success) => {
          if (!success) {
            res.status(401);
            res.json({ success: false, error: 'Wrong email/password' });
            return;
          }

          database.loggedUser(user.id);
          req.session.user = user.jsoned();
          let token = CryptoHelper.hashBase64('csrf', req.session.id + config.hmac_secret);
          res.json({ success: true, user: req.session.user, token: token });
        });
      });
    });

    api.post('/user/request_new_password', requiresNotLoggedIn, (req, res) => {
      if (!req.body.email) {
        throw 'Missing email';
      }

      if (!validator.isEmail(req.body.email)) {
        res.status(401);
        res.json({ success: false, error: 'Not an email' });
        return;
      }

      let email = validator.normalizeEmail(req.body.email);
      database.getUserByEmail(email, (user) => {
        if (user) {
          user.sendResetPassMail(config);
        }
        res.json({ success: true });
      });
    });

    api.post(['/user/password_reset'], requiresNotLoggedIn, (req, res) => {
      if (!req.body.user_id || !req.body.timestamp || !req.body.hash) {
        throw 'Missing parameter';
      }

      database.getUserById(req.body.user_id, (user) => {
        if (typeof user === 'undefined') {
          res.status(401);
          res.json({ success: false, error: 'Wrong parameter' });
          return;
        }
        
        // First login does not expires. Other expires after 24 hours
        if (user.login > 0 && req.body.timestamp > Math.round(new Date().getTime()/1000) - 24*3600) {
          res.status(401);
          res.json({ success: false, error: 'Wrong parameter' });
          return;
        }

        if (!CryptoHelper.checkBase64Hash([req.body.timestamp, user.login, user.id, user.password].join(':'), req.body.hash, config.hmac_secret)) {
          res.status(401);
          res.json({ success: false, error: 'Wrong parameter' });
          return;
        }

        let passwordToken = CryptoHelper.randomKeyBase64(64);
        req.session.passworkToken = passwordToken;

        database.loggedUser(user.id);
        req.session.user = user.jsoned();
        let token = CryptoHelper.hashBase64('csrf', req.session.id + config.hmac_secret);
        res.json({ success: true, user: req.session.user, token: token, passwordToken: passwordToken });
      });
    });

    api.post('/user/check', (req, res) => {
      if (!req.session || !req.session.user) {
        res.json({ state: 'not logged in', user: null });
        return;
      }

      database.getUserById(req.session.user.id, (user) => {
        if (typeof user === 'undefined') {
          req.session.destroy(function(err) {
            res.json({ state: 'not logged in', user: null });
          });
          return;
        }

        // Update the user object
        req.session.user = user.jsoned();
        let token = CryptoHelper.hashBase64('csrf', req.session.id + config.hmac_secret);
        res.json({ state: 'logged in', user: req.session.user, token: token });
      });
    });

    // Every endpoint below requires login-in
    api.use((req, res, next) => {
      if (!req.session || !req.session.user) {
        res.status(403);
        res.json({ success: false, error: 'Not logged-in' });
      } else {
        next();
      }
    });

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
        res.status(403);
        res.json({ success: false, error: 'CSRF token check failed' });
      } else {
        next();
      }
    });

    api.put('/user/:id/edit', (req, res) => {
      if (isNaN(+req.params.id)) {
        res.status(500);
        res.json({ success: false, error: 'No user id given' });
        return;
      }

      let id = req.params.id;
      database.getUserById(id, (user) => {
        // Check we're the current user...
        if (typeof user === 'undefined' || user.id !== req.session.user.id) {
          res.status(404);
          res.json({ success: false, error: 'User not found' });
          return;
        }

        if (req.body.email && user.email !== req.body.email) {
          // We're trying to change the email. 
          // We can only do so if it's valid, non used at other place
          // And if there is a valid password to validate the operation.
          // TODO! (need also a new mail validation mechanism.)
        }

        if (req.body.new_pass) {
          // TODO: check if the password is strong enough

          // We either need to validate the password (length, strongness...)
          // And also check if we have a valid hash, or a valid current password
          if (req.body.pass_token && req.body.pass_token === req.session.passworkToken) {
            // Validation has been done. We change the password
            CryptoHelper.hashPassword(req.body.new_pass, (err, hash) => {
              if (err) {
                res.status((500));
                res.json({ success: false, error: err.toString() });
                return;
              }

              // Save the new hash
              user.password = hash;
              database.updateUser(user);

              res.json({ success: true });
            });   
            return;
          }
          if (req.body.current_pass) {
            // Check current pass.
            CryptoHelper.comparePassword(req.body.current_pass, user.hash, (err, success) => {
              if (!success) {
                res.status(406);
                res.json({ success: false, error: 'Changing password requires current password' });
              }

              // Validation has been done. We change the password
              CryptoHelper.hashPassword(req.body.new_pass, (err, hash) => {
                if (err) {
                  res.status((500));
                  res.json({ success: false, error: err.toString() });
                  return;
                }

                // Save the new hash
                user.password = hash;
                database.updateUser(user);

                res.json({ success: true });
              });   
            });
            return;
          }

          res.status(406);
          res.json({ success: false, error: 'Changing password requires current password' });
          return; 
        }

        // Nothing happened
        res.json({ success: true });
      });
    });

    // Logging out
    api.post('/user/logout', (req, res) => {
      // delete session object
      req.session.destroy(function(err) {
        if(err) {
          throw err;
        }
        res.json({ success: true });
      });
    });


    /** FEEDER HANDLING **/

    api.post('/feeder/claim', (req, res) => {
        if (typeof req.body.identifier === 'undefined') {
          res.status(500);
          res.json({ success: false, error: 'No feeder identifier given' });
          return;
        }

        let ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
        if (!validator.isIP(ip)) {
          res.status(401);
          res.json({ success: false, error: 'Feeder not found' });
          return;
        }

        database.claimFeeder(req.body.identifier, req.session.user.id, ip, (success) => {
          if (!success) {
            res.status(401);
            res.json({ success: false, error: 'Feeder not found' });
          } else {
            res.json({ success: true });
          }
        });
      });

    // We now need to check feeder association
    api.use((req, res, next) => {
      let id = req.path.split('/')[2];
      if (isNaN(+id)) {
        res.status(500);
        res.json({ success: false, error: 'No feeder id given' });
        return;
      }

      database.checkFeederAssociation(id, req.session.user.id, (feeder) => {
        if (!feeder) {
          res.status(404);
          res.json({ success: false, error: 'Feeder not found' });
          return;
        }

        req.feeder = feeder;
        next();
      });
    });

    api.get('/feeder/:id/status', (req, res) => {
      let feeders = feederCoordinator.getFeeder(req.feeder.identifier);
      res.json(feeders.jsoned());
    });

    api.post('/feeder/:id/feed', (req, res) => {
      let quantity = new Quantity(req.body.quantity);
      feederCoordinator.feedNow(req.feeder.identifier, quantity, (msg) => {
        if (msg !== 'success') {
          throw msg;
        }
        res.json({ success: true });
      });
    });

    api.put('/feeder/:id/quantity', (req, res) => {
      let quantity = new Quantity(req.body.quantity);
      feederCoordinator.setDefaultQuantity(req.feeder.identifier, quantity, (msg) => {
        if (msg !== 'success') {
          throw msg;
        }
        res.json({ success: true });
      });
    });

    api.route('/feeder/:id/planning')
      .get((req, res) => {
        // Fetch the planning if it's exists
        database.getCurrentPlanning(req.feeder.identifier, (planning) => {
          if (typeof planning === 'undefined') {
            res.status(500);
            res.json({ success: false, error: 'No planning' });
          }
          res.json({ success: true, meals: planning.jsoned() });
        });
      })
      .put((req, res) => {
        let meals = req.body.meals.map((obj) => { return new Meal(obj.time, obj.quantity, obj.enabled); });
        let planning = new Planning(meals);
        feederCoordinator.setPlanning(req.feeder.identifier, planning, (msg) => {
          if (msg !== 'success') {
            throw msg;
          }
          res.json({ success: true });
        });
      });


    // Error handling at the end
    api.use((err, req, res, next) => {
      res.status(500);
      res.json({ success: false, error: err.toString() });
    });

    return api;
  }
}

module.exports = Server;
