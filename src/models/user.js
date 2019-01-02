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
   * @param {{id: number, email: string, password: string, register: string, login: string, feeders: string|null}} row
   */
  constructor (row) {
    this.id = row.id;
    this.email = row.email;
    this.password = row.password;
    this.register = row.register;
    this.login = row.login;

    if (row.feeders) {
      this.feeders = row.feeders.split(',').reduce(function (carry, identifier) {
        carry[identifier] = identifier;
        return carry;
      }, {});
    }
    else {
      this.feeders = undefined;
    }
  }

  /**
   * @param {boolean} registration
   * @param {{hmac_secret: string, base_url: string}} config
   */
  sendResetPassMail(registration, config) {
    // generate token
    let type = registration ? 'create_password' : 'reset_password';
    let timestamp = Math.round(new Date().getTime()/1000);
    let hash = CryptoHelper.hashBase64([timestamp, this.login, this.id, this.password].join(':'), config.hmac_secret);
    let url = config.base_url + '/user/' + type + '/' + this.id + '/' + timestamp + '/' + hash;
    // TODO: send mail!
    console.log(url);
  }

  /**
   * @returns {{id: number, email: string}}
   */
  jsoned () {
    return {
      id: this.id,
      email: this.email,
      register: this.register ? this.register.toJSON() : null,
      login: this.login ? this.login.toJSON() : null,
      feeders: this.feeders,
    };
  }

}

module.exports = User;
