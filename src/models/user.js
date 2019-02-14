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

const CryptoHelper = require('../crypto-helper');

class User {

  /**
   * @param {{id: number, email: string, email_shown: string, email_unvalidated: string|null, password: string, register: string, login: string, feeders: string|null}} row
   */
  constructor (row) {
    this.id = row.id;
    this.email = row.email;
    this.shown_email = row.email_shown;
    this.unvalidated_email = row.email_unvalidated;
    this.password = row.password;
    this.register = row.register;
    this.login = row.login;

    if (row.feeders) {
      this.feeders = row.feeders.split(',').reduce(function (carry, data) {
        let components = data.split(':');
        let feeder = {
          id: +components[0],
        };
        if (components[1]) {
          feeder.name = components[1];
        }
        if (components[2]) {
          feeder.defaultAmount = components[2];
        }
        carry.push(feeder);
        return carry;
      }, []);
    }
    else {
      this.feeders = undefined;
    }
  }

  /**
   * @param {{hmac_secret: string, base_url: string}} config
   * @param {string} type
   * @param {string} key
   */
  generateUrl(config, type, key) {
    let timestamp = Math.round(new Date().getTime()/1000);
    let hash = CryptoHelper.hashBase64([timestamp, this.id, key].join(':'), config.hmac_secret);
    return config.base_url + '/user/' + type + '/' + this.id + '/' + timestamp + '/' + hash;
  }

  /**
   * @param {{hmac_secret: string, base_url: string}} config
   */
  sendResetPassMail(config) {
    // generate token
    let type = this.login ? 'reset_password' : 'create_password';
    let url = this.generateUrl(config, type, this.login + ':' + this.password);

    // TODO: send mail!
  }

  /**
   * @param {{hmac_secret: string}} config
   * @param {number} timestamp
   * @param {string} hash
   * @return {boolean}
   */
  validatePassMail(config, timestamp, hash) {
    // First login does not expires. Other expires after 24 hours
    if (this.login > 0 && timestamp > Math.round(new Date().getTime()/1000) - 24*3600) {
      return false;
    }

    return CryptoHelper.checkBase64Hash([timestamp, this.id, this.login, this.password].join(':'), hash, config.hmac_secret);
  }

  /**
   * @param {{hmac_secret: string, base_url: string}} config
   */
  sendValidateEmailMail(config) {
    let url = this.generateUrl(config, 'validate_email', this.unvalidated_email);

    // send a mail to unvalidated_email value.
    // Also send a mail to mail value warning about the change.
    // TODO: send mail!
  }

  /**
   * @param {{hmac_secret: string}} config
   * @param {number} timestamp
   * @param {string} hash
   * @return {boolean}
   */
  validateEmailMail(config, timestamp, hash) {
    // Validity of such mail is 24h
    if (timestamp > Math.round(new Date().getTime()/1000) - 24*3600) {
      return false;
    }

    return CryptoHelper.checkBase64Hash([timestamp, this.id, this.unvalidated_email].join(':'), hash, config.hmac_secret);
  }

  /**
   * @param {DataBaseCoordinator} database
   * @return Promise
   */
  validateUnvalidatedMail(database) {
    return new Promise((resolve, reject) => {

      if (this.unvalidated_email === undefined || this.unvalidated_email === null) {
        reject(new Error('No validating email pending'));
        return;
      }

      const validator = require('validator');
      if (!validator.isEmail(this.unvalidated_email)) {
        reject(new Error('No validating email pending'));
        return;
      }

      this.email = validator.normalizeEmail(this.unvalidated_email);
      this.shown_email = this.unvalidated_email;
      this.unvalidated_email = null;
      return database.updateUser(this);
    });
  }

  /**
   * @returns {{id: number, email: string}}
   */
  jsoned () {
    return {
      id: this.id,
      email: this.email,
      shown_email: this.shown_email,
      register: this.register ? this.register.toJSON() : null,
      login: this.login ? this.login.toJSON() : null,
      feeders: this.feeders,
    };
  }

}

module.exports = User;
