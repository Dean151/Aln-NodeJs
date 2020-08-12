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

const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const NodeRSA = require('node-rsa');

class CryptoHelper {

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
     * @param {Array<{kty: string, kid: string, use: string, alg: string, n: string, e: string}>} keys
     * @param {string} idToken
     * @param {string} clientId
     * @return {Promise<{aud: string, exp: number, iat: number, sub: string}>}
     */
    static checkAppleToken(keys, idToken, clientId) {
        return new Promise((resolve, reject) => {
            let getKey = (header, callback) => {
                const pubKey = new NodeRSA();
                for (var index in keys) {
                    var key = keys[index];
                    if (key.kid !== header.kid) {
                        continue;
                    }
                    pubKey.importKey({ n: Buffer.from(key.n, 'base64'), e: Buffer.from(key.e, 'base64') }, 'components-public');
                    callback(null, pubKey.exportKey(['public']));
                    return;
                }
                callback(new Error('Matching signature key not found'), null);
            };
            jwt.verify(idToken, getKey, (err, data) => {
                if (err) {
                    reject(err);
                    return;
                }
                if (data.payload.iss !== 'https://appleid.apple.com') {
                    reject(new Error('id token not issued by correct OpenID provider - expected: https://appleid.apple.com | is: ' + data.payload.iss));
                    return;
                }
                if (clientId !== undefined && data.payload.aud !== clientId) {
                    reject(new Error('aud parameter does not include this client - expected: ' + clientId + ' | is: ' + data.payload.aud));
                    return;
                }
                if (data.payload.exp < (Date.now() / 1000)) {
                    reject(new Error('id token has expired'));
                    return;
                }
                return data.payload;
            });
        });
    }
}

module.exports = CryptoHelper;
