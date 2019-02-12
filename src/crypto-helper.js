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

const bcrypt = require('bcrypt');
const crypto = require('crypto');
const secureRandom = require('secure-random');

class CryptoHelper {

    /**
     * @param {string} password
     * @return Promise
     */
    static hashPassword(password) {
        return new Promise((resolve, reject) => {
            bcrypt.hash(password, 10, (err, hash) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(hash);
                }
            });
        });
    }

    /**
     * @param {string} password 
     * @param {string} hash 
     * @return Promise
     */
    static comparePassword(password, hash) {
        return new Promise((resolve, reject) => {
            bcrypt.compare(password, hash, (err, success) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(success);
                }
            });
        });
    }

    /**
     * @param {string} data 
     * @param {string} key
     * @return {string}
     */
    static hashBase64(data, key) {
        const hasher = crypto.createHmac('sha256', key);
        hasher.update(data);
        // Modify the hash so it's safe to use in URLs.
        return hasher.digest('base64').replace('+', '-').replace('/', '_').replace('=', '');
    }

    /**
     * @param {string} data 
     * @param {string} hash 
     * @param {string} key
     * @return {boolean}
     */
    static checkBase64Hash(data, hash, key) {
        return hash === CryptoHelper.hashBase64(data, key);
    }

    /**
     * @param {number} bytes 
     */
    static randomKeyBase64(bytes) {
        return secureRandom.randomBuffer(bytes).toString('base64').replace('+', '-').replace('/', '_').replace('=', '');
    }

}

module.exports = CryptoHelper;
