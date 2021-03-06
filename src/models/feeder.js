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

class Feeder {

  /**
   * @param {string} identifier
   * @param {net.Socket|Date|null} socket
   */
  constructor(identifier, socket) {
    this.identifier = identifier;

    if (socket.constructor === Date) {
      this.lastResponded = socket;
    } else {
      this.hasResponded(socket);
    }
  }

  /**
   * @param {net.Socket} socket
   */
  hasResponded (socket) {
    this.socket = socket;
    this.lastResponded = new Date();
  }

  /**
   * @returns {{identifier: string, isAvailable: boolean, lastResponded: string}}
   */
  jsoned () {
    return {
      last_responded: this.lastResponded.toJSON(),
      is_available: this.socket !== undefined && (Math.floor((new Date() - this.lastResponded) / 1000) <= 30),
    };
  }

  /**
   * @param {Buffer} data
   * @return Promise
   */
  send (data) {
    return new Promise((resolve, reject) => {
      if (this.socket === undefined) {
        reject(new Error('Socket is not opened'));
        return;
      }
      this.socket.write(data, () => {
        console.log("Data sent: " + data.toString('hex'));
        resolve();
      });
    });
  }
}

module.exports = Feeder;
