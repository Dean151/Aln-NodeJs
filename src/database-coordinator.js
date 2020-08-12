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
    this.con = mysql.createConnection({
      host: config.mysql_host,
      user: config.mysql_user,
      password: config.mysql_password,
      database: config.mysql_database
    });

    this.con.connect((err) => {
      if (err) {
        throw err;
      }

      this.con.query('SHOW TABLES LIKE ?;', ['feeders'], (err, result, fields) => {
        if (result.length === 0) {
          throw 'Tables does not exists. You need to run init.sql file to create them!';
        }
        else {
            console.log('Database connection is ready');
        }
      });
    });
  }

  /**
   * @param {number} id
   * @return Promise
   */
  getUserById(id) {
    return this.getUserBy('id', id);
  }

  /**
   * @param {string} apple_id
   * @return Promise
   */
  getUserByAppleId(apple_id) {
    return this.getUserBy('apple_id', apple_id);
  }

  /**
   * @param {string} column 
   * @param {string|number} value
   * @return Promise
   */
  getUserBy(column, value) {
    return new Promise((resolve, reject) => {

      let query = 'SELECT u.*, GROUP_CONCAT(CONCAT(f.id, \':\', f.name, \':\', f.default_value)) as feeders FROM users u LEFT JOIN feeders f ON f.owner = u.id ';
      if (column === 'id') {
        query += 'WHERE u.id = ?';
      }
      else if (column === 'apple_id') {
        query += 'WHERE u.apple_id = ?';
      }
      else {
        reject(new Error('Undetermined column for getting user'));
        return;
      }
      query += ' HAVING u.id IS NOT NULL';

      this.con.query(query, [value], (err, results, fields) => {
        if (err) {
          reject(err);
          return;
        }

        // Parse the meals results
        if (results.length) {
          const User = require('./models/user');
          resolve(new User(results[0]));
        } else {
          resolve(undefined);
        }
      });
    });
  }

  /**
   * @param {number} user_id
   * @return Promise
   */
  loggedUser(user_id) {
    return new Promise((resolve, reject) => {
      this.con.query('UPDATE users SET login = CURRENT_TIMESTAMP where id = ?', [user_id], (err, result, fields) => {
        if (err) {
          reject(err);
        }
        else {
          resolve();
        }
      });
    });
  }

  /**
   * @param {{apple_id: string, email: string, shown_email: string}} data
   * @return Promise
   */
  createUser(data) {
    return new Promise((resolve, reject) => {
      this.con.query('INSERT INTO users (apple_id, email, email_shown) VALUES (?, ?, ?, ?)', [data.apple_id, data.email, data.shown_email], (err, result, fields) => {
        if (err) {
          reject(err);
          return;
        }
        resolve();
      });
    });
  }

  /**
   * @param {string} identifier
   * @param {number} user_id
   * @param {string} ip
   * @return Promise
   */
  claimFeeder(identifier, user_id, ip) {
    return new Promise((resolve, reject) => {
      this.con.query('UPDATE feeders SET owner = ? WHERE owner IS NULL AND identifier = ? AND ip LIKE ?', [user_id, identifier, '%:' + ip + ':%'], (err, result, fields) => {
        if (err) {
          reject(err);
        }
        else {
          resolve(result.affectedRows >= 1);
        }
      });
    });
  }

  /**
   * @param {number} feeder_id
   * @param {number} user_id
   * @return Promise
   */
  checkFeederAssociation(feeder_id, user_id) {
    return new Promise((resolve, reject) => {
      this.con.query('SELECT * FROM feeders WHERE owner = ? AND id = ?', [user_id, feeder_id], (err, result, fields) => {
        if (err) {
          reject(err);
        }
        else {
          resolve(result.length ? result[0] : undefined);
        }
      });
    });
  }

  /**
   * @param {string} identifier
   * @return Promise
   */
  fetchFeederLastResponded(identifier) {
    return new Promise((resolve, reject) => {
      this.con.query('SELECT last_responded FROM feeders WHERE identifier = ?', [identifier], (err, result, fields) => {
        if (err) {
          reject(err);
        }
        else {
          const Feeder = require("./models/feeder");
          resolve(result.length && result[0].last_responded ? new Feeder(identifier, new Date(result[0].last_responded)) : undefined);
        }
      });
    });
  }

  /**
   * @param {string} identifier
   * @param {string} ip
   * @return Promise
   */
  registerFeeder(identifier, ip) {
    return new Promise((resolve, reject) => {
      // We try to update the feeder registry.
      let now = new Date();
      let date = now.toJSON().slice(0, 10) + ' ' + now.toJSON().slice(11, 19);
      this.con.query('UPDATE feeders SET last_responded = ?, ip = ? WHERE identifier = ?', [date, ip, identifier], (err, result, fields) => {
        if (err) {
          reject(err);
          return;
        }

        if (result.affectedRows < 1) {
          // We insert the new row in the feeder registry.
          this.con.query('INSERT INTO feeders(identifier, name, default_value, last_responded, ip) VALUES (?, ?, ?, ?, ?)', [identifier, "", 5, date, ip], (err, result, fields) => {
            if (err) {
              reject(err);
            } else {
              resolve();
            }
          });
        }
        else {
          resolve();
        }
      });
    });
  }

  /**
   * @param id
   * @param name
   * @return Promise
   */
  setFeederName(id, name) {
    return new Promise((resolve, reject) => {
      this.con.query('UPDATE feeders SET name = ? WHERE id = ?', [name, id], (err, result, fields) => {
        if (err) {
          reject(err);
        }
        else {
          resolve(result.affectedRows >= 1);
        }
      });
    });
  }

  /**
   * @param {string} identifier
   * @param {Quantity} quantity
   * @return Promise
   */
  rememberDefaultAmount(identifier, quantity) {
    return new Promise((resolve, reject) => {
      this.con.query('UPDATE feeders SET default_value = ? WHERE identifier = ?', [quantity.amount, identifier], (err, result, fields) => {
        if (err) {
          reject(err);
        }
        else {
          resolve(result.affectedRows >= 1);
        }
      });
    });
  }

  /**
   * @param {string} identifier
   * @param {Quantity} quantity
   * @return Promise
   */
  recordMeal(identifier, quantity) {
    return new Promise((resolve, reject) => {
      let now = new Date();
      let date = now.toJSON().slice(0, 10);
      let time = now.toJSON().slice(11, 19);
      this.con.query('INSERT INTO meals(feeder, date, time, quantity) VALUES ((SELECT id FROM feeders WHERE identifier = ?), ?, ?, ?)', [identifier, date, time, quantity.amount], (err, result, fields) => {
        if (err) {
          reject(err);
        }
        else {
          resolve(result.affectedRows >= 1);
        }
      });
    });
  }

  /**
   * @param {number} id
   * @param period
   * @param offset
   * @return {Promise<[{type: string, date: Date, quantity: number}]>}
   */
  getMealHistory(id, period, offset) {
    return new Promise((resolve, reject) => {
      Promise.all([
        this.getPlannedMeals(id, period, offset),
        this.getManualMeals(id, period, offset)
      ]).then((results) => {
        // Merge meals array
        let meals = results[0].concat(results[1]);

        // Sort meals array by DESC dates
        meals.sort((a, b) => { return b.date - a.date; });

        // Return them
        resolve(meals);
      }, reject);
    });
  }

  /**
   * @param {number} id
   * @param period
   * @param offset
   * @return {Promise<[{type: string, date: Date, quantity: number}]>}
   */
  getPlannedMeals(id, period, offset) {
    let dates = this._getDates(period, offset);
    let datesArray = this._getDatesArray(dates.begin, dates.end);

    // This one is tricky : get plannings from the range, and recreate meals manually
    let query = 'SELECT p.date, GROUP_CONCAT(CONCAT(m.time, \'/\', m.quantity)) as meals ' +
      'FROM plannings p ' +
      'LEFT JOIN meals m ON p.id = m.planning AND m.enabled <> 0 ' +
      'WHERE p.feeder = ? AND p.date BETWEEN ? AND ? OR p.date = (SELECT MAX(date) FROM plannings WHERE date < ?) ' +
      'GROUP BY p.id';

    return new Promise((resolve, reject) => {
      this.con.query(query, [id, dates.begin, dates.end, dates.begin], (err, result, fields) => {
        if (err) {
          reject(err);
        } else {
          let plans = result.map((row) => {
            return {
              date: row.date,
              meals: row.meals.split(',').map((data) => {
                let meal = data.split('/');
                return {
                  time: meal[0],
                  quantity: meal[1]
                };
              })
            };
          });

          let meals = plans.map((plan, index)  => {
            let start = plan.date;
            let end = plan[index+1] ? plan[index+1].date : new Date(); // Today is the upper limit if there is now newer plan
            return datesArray.map((date) => {
              return plan.meals.map((meal) => {
                return {
                  type: 'planned',
                  date: new Date(date + 'T' + meal.time), // FIXME: date issues with timezone & DST
                  quantity: meal.quantity,
                };
              }).filter((meal) => {
                return meal.date >= start && meal.date < end;
              });
            }).reduce((carry, meals) => {
              return carry.concat(meals);
            }, []);
          }).reduce((carry, meals) => {
            return carry.concat(meals);
          }, []);

          resolve(meals);
        }
      });
    });
  }

  /**
   * @param {number} id
   * @param period
   * @param offset
   * @return {Promise<[{type: string, date: Date, quantity: number}]>}
   */
  getManualMeals(id, period, offset) {
    let dates = this._getDates(period, offset);

    return new Promise((resolve, reject) => {
      this.con.query('SELECT * FROM meals m WHERE feeder = ? AND m.date IS NOT NULL AND m.date BETWEEN ? AND ?', [id, dates.begin, dates.end], (err, result, fields) => {
        if (err) {
          reject(err);
        } else {
          resolve(result.map((row) => {
            return {
              type: 'manual',
              date: new Date(row.date.toISOString().split('T')[0] + 'T' + row.time),
              quantity: row.quantity,
            };
          }));
        }
      });
    });
  }

  _getDates(period, offset) {
    let dayLength = isNaN(+period) ? 7 : period;
    let dayEnd = (isNaN(+offset) ? 0 : offset) * dayLength;

    let date = new Date();
    date.setDate(date.getDate() - dayEnd);
    let end = date.toISOString().split('T')[0];

    date.setDate(date.getDate() - dayLength);
    let begin = date.toISOString().split('T')[0];

    return {
      begin: begin,
      end: end
    };
  }

  _getDatesArray(start, end) {
    let dateArray = [];
    let currentDate = new Date(start);
    while (currentDate <= new Date(end)) {
      dateArray.push(currentDate.toISOString().split('T')[0]);
      currentDate.setDate(currentDate.getDate() + 1);
    }
    return dateArray;
  }

  /**
   * @param {number} id
   * @return Promise
   */
  getCurrentPlanning(id) {
    return new Promise((resolve, reject) => {
      const Planning = require('./models/planning');
      const Meal = require('./models/meal');

      // Get current planning id
      this.con.query('SELECT time, quantity, enabled FROM meals WHERE planning = (SELECT p.id FROM plannings p WHERE p.feeder = ? ORDER BY p.date DESC LIMIT 1)', [id], (err, results, fields) => {
        if (err) {
          reject(err);
          return;
        }

        // Parse the meals results
        let meals = results.map((row) => { return new Meal(row.time, row.quantity, row.enabled); });
        resolve(new Planning(meals));
      });
    });
  }


  /**
   * @param {string} identifier
   * @param {Planning} planning
   * @return Promise
   */
  recordPlanning(identifier, planning) {
    return new Promise((resolve, reject) => {
      let connection = this.con;
      connection.beginTransaction((err) => {
        if (err) {
          reject(err);
          return;
        }

        let now = new Date();
        let date = now.toJSON().slice(0, 10) + ' ' + now.toJSON().slice(11, 19);

        // We register the planning in the database
        connection.query('INSERT INTO plannings(feeder, date) VALUES ((SELECT id FROM feeders WHERE identifier = ?), ?)', [identifier, date], (err, result, fields) => {
          if (err) {
            connection.rollback(() => {
              reject(err);
            });
            return;
          }

          if (planning.mealsCount() === 0) {
            connection.commit((err) => {
              if (err) {
                connection.rollback(() => {
                  reject(err);
                });
                return;
              }

              resolve();
            });
            return;
          }

          // We then insert all meals in the table meals
          let meals = planning.sqled(result.insertId);
          connection.query('INSERT INTO meals(planning, time, quantity, enabled) VALUES ?', [meals], (err, result, fields) => {
            if (err) {
              connection.rollback(() => {
                reject(err);
              });
              return;
            }

            connection.commit((err) => {
              if (err) {
                connection.rollback(() => {
                  reject(err);
                });
                return;
              }

              resolve();
            });
          });
        });
      });
    });
  }

  /**
   * @param {string} identifier
   * @param {string} type
   * @param {*} data
   * @return Promise
   */
  logAlert(identifier, type, data) {
    return new Promise((resolve, reject) => {
      let now = new Date();
      let date = now.toJSON().slice(0, 10) + ' ' + now.toJSON().slice(11, 19);
      let json = Buffer.from(JSON.stringify(data));

      this.con.query('INSERT INTO alerts(feeder, type, date, data) VALUES ((SELECT id FROM feeders WHERE identifier = ?), ?, ?, ?)', [identifier, type, date, json], (err, result, fields) => {
        if (err) {
          reject(err);
        }
        else {
          resolve(result.affectedRows >= 1);
        }
      });
    });
  }

  /**
   * @param {string} type
   * @param {Buffer} data
   * @param {string} ip
   * @return Promise
   */
  logUnknownData(type, data, ip) {
    return new Promise((resolve, reject) => {
      // Treating the special case of uncomplete data. This happen all the time...
      // We receive multiple times a week the data 0x9da114414c
      // We prevent logging that since it does not actually make sense.
      if (data.toString('hex') === '9da114414c') {
        resolve(false);
        return;
      }

      let now = new Date();
      let date = now.toJSON().slice(0, 10) + ' ' + now.toJSON().slice(11, 19);

      this.con.query('INSERT INTO unknown_data(date, type, ip, data) VALUES (?, ?, ?, ?)', [date, type.substring(0, 64), ip, data], (err, result, fields) => {
        if (err) {
          reject(err);
        }
        else {
          resolve(result.affectedRows >= 1);
        }
      });
    });
  }
}

module.exports = DataBaseCoordinator;
