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

const mysql = require('mysql');

class DataBaseCoordinator {

  /**
   * @param {{mysql_host: string, mysql_user: string, mysql_password: string, mysql_database: string}} config
   */
  constructor (config) {
    this.isConnected = false;

    this.con = mysql.createConnection({
      host: config.mysql_host,
      user: config.mysql_user,
      password: config.mysql_password,
      database: config.mysql_database
    });

    this.con.connect((err) => {
      if (err) {
        console.log('Could not connect to database: ', err);
      }
      else {
        this.con.query('SHOW TABLES LIKE ?;', ['feeders'], (err, result, fields) => {
          if (result.length === 0) {
            // We create the tables, it's the first app start
            console.log('Tables does not exists. You need to run init.sql file to create them!');
          }
          else {
            this.isConnected = true;
            console.log('Database connection is ready');
          }
        });
      }
    });
  }

  /**
   * @returns {boolean}
   */
  isReady() {
    return this.isConnected;
  }

  /**
   * @callback DataBaseCoordinator~getUserCallback
   * @param {User} user
   * @throws
   */

  /**
   * @param {string} email
   * @param {DataBaseCoordinator~getUserCallback} callback
   * @throws
   */
  getUser(email, callback) {
    if (!this.isReady()) {
      throw 'Database is not ready';
    }

    const User = require('./models/user');

    // Get current planning id
    this.con.query('SELECT * FROM users WHERE email = ?', [email], (err, results, fields) => {
      if (err) { throw err; }

      // Parse the meals results
      let user = results.length ? new User(results.first) : undefined;
      callback(user);
    });
  }


  /**
   * @callback DataBaseCoordinator~createUserCallback
   * @param {boolean} success
   * @throws
   */

  /**
   * @param {{email: string, hash: string}} data
   * @param {DataBaseCoordinator~createUserCallback} callback
   */
  createUser(data, callback) {
    if (!this.isReady()) {
      throw 'Database is not ready';
    }

    this.con.query('INSERT INTO users (email, password) VALUES (?, ?)', [data.email, data.hash], (err, result, fields) => {
      if (err) {
        callback(false);
      }
      callback(true);
    });
  }

  /**
   * @param {string} identifier
   * @param {string} ip
   * @throws
   */
  registerFeeder(identifier, ip) {
    if (!this.isReady()) {
      return;
    }

    // We try to update the feeder registry.
    let now = new Date();
    let date = now.toJSON().slice(0, 10) + ' ' + now.toJSON().slice(11, 19);
    this.con.query('UPDATE feeders SET last_responded = ?, ip = ? WHERE identifier = ?', [date, ip, identifier], (err, result, fields) => {
      if (err) {
        throw err;
      }
      if (result.affectedRows < 1) {
        // We insert the new row in the feeder registry.
        this.con.query('INSERT INTO feeders(identifier, last_responded, ip) VALUES (?, ?, ?)', [identifier, date, ip], (err, result, fields) => {
          if (err) {
            throw err;
          }
        });
      }
    });
  }

  /**
   * @param {string} identifier
   * @param {Quantity} quantity
   * @throws
   */
  rememberDefaultAmount(identifier, quantity) {
    if (!this.isReady()) {
      return;
    }

    this.con.query('UPDATE feeders SET default_value = ? WHERE identifier = ?', [quantity.amount, identifier], (err, result, fields) => {
      if (err) {
        throw err;
      }
    });
  }

  /**
   * @param {string} identifier
   * @param {Quantity} quantity
   * @throws
   */
  recordMeal (identifier, quantity) {
    if (!this.isReady()) {
      return;
    }

    let now = new Date();
    let date = now.toJSON().slice(0, 10);
    let time = now.toJSON().slice(11, 19);
    this.con.query('INSERT INTO meals(feeder, date, time, quantity) VALUES ((SELECT id FROM feeders WHERE identifier = ?), ?, ?, ?)', [identifier, date, time, quantity.amount], (err, result, fields) => {
      if (err) {
        throw err;
      }
    });
  }

  /**
   * @callback DataBaseCoordinator~getPlanningCallback
   * @param {Planning} planning
   * @throws
   */

  /**
   * @param {string} identifier
   * @param {DataBaseCoordinator~getPlanningCallback} callback
   * @throws
   */
  getCurrentPlanning (identifier, callback) {
    if (!this.isReady()) {
      throw 'Database is not ready';
    }

    const Planning = require('./models/planning');
    const Meal = require('./models/meal');

    // Get current planning id
    this.con.query('SELECT time, quantity, enabled FROM meals WHERE planning = (SELECT p.id FROM plannings p LEFT JOIN feeders f ON f.id = p.feeder WHERE f.identifier = ? ORDER BY p.date DESC LIMIT 1)', [identifier], (err, results, fields) => {
      if (err) { throw err; }

      // Parse the meals results
      let meals = results.map((row) => { return new Meal(row.time, row.quantity, row.enabled); });
      callback(new Planning(meals));
    });
  }


  /**
   * @param {string} identifier
   * @param {Planning} planning
   * @throws
   */
  recordPlanning (identifier, planning) {
    if (!this.isReady()) {
      return;
    }

    let connection = this.con;

    let now = new Date();
    let date = now.toJSON().slice(0, 10) + ' ' + now.toJSON().slice(11, 19);

    connection.beginTransaction((err) => {
      if (err) { throw err; }

      // We register the planning in the database
      connection.query('INSERT INTO plannings(feeder, date) VALUES ((SELECT id FROM feeders WHERE identifier = ?), ?)', [identifier, date], (err, result, fields) => {
        if (err) {
          return connection.rollback(() => {
            throw err;
          });
        }

        if (planning.mealsCount() === 0) {
          connection.commit((err) => {
            if (err) {
              return connection.rollback(() => {
                throw err;
              });
            }
          });
        }
        else {
          // We then insert all meals in the table meals
          let meals = planning.sqled(result.insertId);
          connection.query('INSERT INTO meals(planning, time, quantity, enabled) VALUES ?', [meals], (err, result, fields) => {
            if (err) {
              return this.con.rollback(() => {
                throw err;
              });
            }
            connection.commit((err) => {
              if (err) {
                return connection.rollback(() => {
                  throw err;
                });
              }
            });
          });
        }
      });
    });
  }

  /**
   * @param {string} identifier
   * @param {string} type
   * @param {*} data
   * @throws
   */
  logAlert (identifier, type, data) {
    if (!this.isReady()) {
      return;
    }

    let now = new Date();
    let date = now.toJSON().slice(0, 10) + ' ' + now.toJSON().slice(11, 19);
    let json = Buffer.from(JSON.stringify(data));

    this.con.query('INSERT INTO alerts(feeder, type, date, data) VALUES ((SELECT id FROM feeders WHERE identifier = ?), ?, ?, ?)', [identifier, type, date, json], (err, result, fields) => {
      if (err) {
        throw err;
      }
    });
  }

  /**
   * @param {string} type
   * @param {Buffer} data
   * @param {string} ip
   * @throws
   */
  logUnknownData (type, data, ip) {
    if (!this.isReady()) {
      return;
    }

    // Treating the special case of uncomplete data. This happen all the time...
    // We receive multiple times a week the data 0x9da114414c
    // We prevent logging that since it does not actually make sence.
    if (data.toString('hex').match(/^9da114414c$/)) {
      return;
    }

    let now = new Date();
    let date = now.toJSON().slice(0, 10) + ' ' + now.toJSON().slice(11, 19);

    this.con.query('INSERT INTO unknown_data(date, type, ip, data) VALUES (?, ?, ?, ?)', [date, type.substring(0, 64), ip, data], (err, result, fields) => {
      if (err) {
        throw err;
      }
    });
  }
}

module.exports = DataBaseCoordinator;
