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

class User {

  /**
   * @param {{id: number, apple_id: string, email: string, email_shown: string: string|null, register: string, login: string, feeders: string|null}} row
   */
  constructor (row) {
    this.id = row.id;
    this.apple_id = row.apple_id;
    this.email = row.email;
    this.shown_email = row.email_shown;
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
          feeder.defaultAmount = +components[2];
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
   * @returns {{id: number, email: string, register: string, login: string, feeders: Array}}
   */
  jsoned () {
    return {
      id: this.id,
      email: this.shown_email,
      register: this.register ? this.register.toJSON() : null,
      login: this.login ? this.login.toJSON() : null,
      feeders: this.feeders,
    };
  }

}

module.exports = User;
