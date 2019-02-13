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
const Checker = require('password-checker');

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

    let web = Server.createWebRouter(config, database);
    app.use('/', web);

    http.createServer(app).listen(config.local_port, 'localhost');
  }

  static createWebRouter(config, database) {
    let web = express.Router();

    web.route('/user/:type/:id/:timestamp/:hash').get((req, res, next) => {
      var availableTypes = ['create_password', 'reset_password', 'validate_email'];
      if (availableTypes.indexOf(req.params.type) === -1) {
        throw new HttpError('Not found', 404);
      }

      // Validate the link.
      database.getUserById(req.params.id).then((user) => {
        if (user === undefined) {
          throw new HttpError('Not found', 404);
        }

        if (req.params.type !== 'validate_email' && !user.validatePassMail(config, req.params.timestamp, req.params.hash)) {
          throw new HttpError('Link is unvalid', 403);
        }
        if (req.params.type === 'validate_email' && !user.validateEmailMail(config, req.params.timestamp, req.params.hash)) {
          throw new HttpError('Link is unvalid', 403);
        }

        // TODO: show a page that will handle the link
        // TODO: show a page that would redirect to the application.
        // Or eventually explain to open the link on the iOS device.

      }).catch(next);
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
            paths:['/user/create_password/*', '/user/reset_password/*', '/user/reset_password/*']
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
      res.render('error', { error: err });
    });
    
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
        throw new HttpError( 'Already logged-in as ' + req.session.user.email, 403);
      }
      next();
    };

    /** AUTHENTICATION MECHANISMS **/

    api.post('/user/register', requiresNotLoggedIn, (req, res, next) => {
      if (!req.body.email) {
        throw new HttpError('Missing email', 400);
      }

      if (!validator.isEmail(req.body.email)) {
        throw new HttpError('Not an email', 400);
      }

      // Check if the user already exists
      let email = validator.normalizeEmail(req.body.email);
      database.getUserByEmail(email).then((user) => {
        if (user) {
          throw new HttpError('Email already in use', 406);
        }

        var data = {
          email: email,
          shown_email: req.body.email,
          hash: 'not-an-hash',
        };

        Promise.all([database.createUser(data), database.getUserByEmail(email)]).then((results) => {
          var user = results[1];
          if (!user) {
            throw new HttpError('Registration failed', 500);
          }

          user.sendResetPassMail(config);
          res.json({ success: true });
        }).catch(next);
      }).catch(next);
    });

    api.post('/user/login', requiresNotLoggedIn, (req, res, next) => {
      if (!req.body.email || !req.body.password) {
        throw new HttpError('Missing email or password', 400);
      }

      let email = validator.normalizeEmail(req.body.email);
      database.getUserByEmail(email).then((user) => {
        if (user === undefined) {
          throw new HttpError('Wrong email/password', 401);
        }

        CryptoHelper.comparePassword(req.body.password, user.password).then((success) => {
          if (!success) {
            throw new HttpError('Wrong email/password', 401);
          }

          database.loggedUser(user.id).then(() => {
            req.session.user = user.jsoned();
            let token = CryptoHelper.hashBase64('csrf', req.session.id + config.hmac_secret);
            res.json({ success: true, user: req.session.user, token: token });
          }).catch(next);
        }).catch(next);
      }).catch(next);
    });

    api.post('/user/request_new_password', requiresNotLoggedIn, (req, res, next) => {
      if (!req.body.email) {
        throw new HttpError('Missing email', 400);
      }

      if (!validator.isEmail(req.body.email)) {
        throw new HttpError('Not an email', 400);
      }

      let email = validator.normalizeEmail(req.body.email);
      database.getUserByEmail(email).then((user) => {
        if (user) {
          user.sendResetPassMail(config);
        }
        res.json({ success: true });
      }).catch(next);
    });

    api.post('/user/password_reset', requiresNotLoggedIn, (req, res, next) => {
      if (!req.body.user_id || !req.body.timestamp || !req.body.hash) {
        throw new HttpError('Missing parameter', 400);
      }

      database.getUserById(req.body.user_id).then((user) => {
        if (user === undefined) {
          throw new HttpError('Wrong parameter', 401);
        }

        if (!user.validatePassMail(config, req.body.timestamp, req.body.hash)) {
          throw new HttpError('Wrong parameter', 401);
        }

        let passwordToken = CryptoHelper.randomKeyBase64(64);
        req.session.passworkToken = passwordToken;

        database.loggedUser(user.id).then(() => {
          req.session.user = user.jsoned();
          let token = CryptoHelper.hashBase64('csrf', req.session.id + config.hmac_secret);
          res.json({ success: true, user: req.session.user, token: token, passwordToken: passwordToken });
        }).catch(next);
      }).catch(next);
    });

    api.post('/user/validate_email', (req, res, next) => {
      if (!req.body.user_id || !req.body.timestamp || !req.body.hash) {
        throw new HttpError('Missing parameter', 400);
      }

      database.getUserById(req.body.user_id).then((user) => {
        if (user === undefined) {
          throw new HttpError('Wrong parameter', 401);
        }

        if (!user.validateEmailMail(config, req.body.timestamp, req.body.hash)) {
          throw new HttpError('Wrong parameter', 401);
        }

        // TODO: enable validated email

        res.json({ success: true });
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

    api.put('/user/:id', (req, res, next) => {
      if (isNaN(+req.params.id)) {
        throw new HttpError('User not found', 404);
      }

      let id = req.params.id;
      database.getUserById(id).then((user) => {
        // Check we're the current user...
        if (user === undefined || user.id !== req.session.user.id) {
          throw new HttpError('User not found', 404);
        }

        // Updating email
        var shouldUpdateEmail = new Promise((resolve, reject) => {
          if (!req.body.email || user.email === validator.normalizeEmail(req.body.email)) {
            resolve(false);
            return;
          }

          if (!validator.isEmail(req.body.email)) {
            reject(new HttpError('Not an email', 400));
          }

          if (!req.body.current_pass) {
            reject(new HttpError('Changing password requires current password', 406));
            return;
          }

          CryptoHelper.comparePassword(req.body.current_pass, user.hash).then((success) => {
            if (!success) {
              reject(new HttpError('Changing password requires current password', 406));
              return;
            }
            resolve(true);
          }, reject);
        });

        // Updating password
        var shouldUpdatePassword = new Promise((resolve, reject) => {
          if (!req.body.new_pass) {
            resolve(false);
            return;
          }

          // Check password strongness
          var checker = new Checker();
          checker.min_length = 8;
          checker.disallowNames(true);
          checker.disallowWords(true, true);
          if (!checker.check(req.body.new_pass)) {
            reject(new HttpError('New password not strong enough', 412));
            return;
          }

          // And also check if we have a valid hash, or a valid current password
          if (req.body.pass_token && req.body.pass_token === req.session.passworkToken) {
            resolve(true);
            return;
          }

          if (!req.body.current_pass) {
            reject(new HttpError('Changing password requires current password', 406));
            return;
          }

          CryptoHelper.comparePassword(req.body.current_pass, user.hash).then((success) => {
              if (!success) {
                reject(new HttpError('Changing password requires current password', 406));
                return;
              }
              resolve(true);
            }, reject);
        });

        Promise.all([shouldUpdateEmail, shouldUpdatePassword]).then(() => {

          var updateEmail = new Promise((resolve, reject) => {
            if (!req.body.email) {
              resolve();
              return;
            }
            user.unvalidated_email = req.body.email;
            user.sendValidateEmailMail(config);
            resolve();
          });

          var updatePassword = new Promise((resolve, reject) => {
            if (!req.body.new_pass) {
              resolve();
              return;
            }
            CryptoHelper.hashPassword(req.body.new_pass).then((hash) => {
              // Save the new hash
              user.password = hash;
              resolve();
            }, reject);
          });

          Promise.all([updateEmail, updatePassword, database.updateUser(user)]).then(() => {
            res.json({success: true});
          }).catch(next);
        });
      }).catch(next);
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
        res.status(err.code);
        res.json({ success: false, message: err.message });
        return;
      }

      if (err instanceof Error) {
        res.status(500);
        res.json({ success: false, message: err.message });
        return;
      }

      res.status(500);
      res.json({ success: false, error: err });
    });

    return api;
  }
}

module.exports = Server;
