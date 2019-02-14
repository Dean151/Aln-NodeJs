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

const nodemailer = require('nodemailer');

class ExternalCommunicator {

  constructor(config) {
    this.name = config.product_name;
    this.sender = config.sender_mail;
    this.mailer = nodemailer.createTransport(config.mail_transporter);
  }

  /**
   * @param {string} to
   * @param {string} username
   * @param {string} subject
   * @param {string} content
   * @return {Promise}
   */
  sendMail(to, username, subject, content) {
    return new Promise((resolve, reject) => {
      this.mailer.sendMail({
        from: '"' + this.name + '" <' + this.sender + '>',
        to: to,
        subject: '[' + this.name + '] ' + subject,
        text: 'Hi ' + username + '\n\n' + content + '\n\nThe ' + this.name + ' team.'
      }, (err, info) => {
        if (err) {
          reject(err);
        } else {
          resolve(info);
        }
      });
    });
  }

}