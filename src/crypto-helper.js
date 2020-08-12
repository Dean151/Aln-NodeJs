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
     * @param {{kty: string, kid: string, use: string, alg: string, n: string, e: string}} key
     * @param {string} idToken
     * @param {string} clientId
     * @return {{aud: string, exp: number, iat: number, sub: string}}
     */
    static checkAppleToken(key, idToken, clientId) {
        const pubKey = new NodeRSA();
        pubKey.importKey({ n: Buffer.from(key.n, 'base64'), e: Buffer.from(key.e, 'base64') }, 'components-public');
        let applePublicKey = pubKey.exportKey(['public']);
        const jwtClaims = jwt.verify(idToken, applePublicKey, { algorithms: [key.alg] });
        if (jwtClaims.iss !== 'https://appleid.apple.com') {
            throw new Error('id token not issued by correct OpenID provider - expected: https://appleid.apple.com | is: ' + jwtClaims.iss);
        }
        if (clientId !== undefined && jwtClaims.aud !== clientId) {
            throw new Error('aud parameter does not include this client - expected: ' + clientId + ' | is: ' + jwtClaims.aud);
        }
        if (jwtClaims.exp < (Date.now() / 1000)) {
            throw new Error('id token has expired');
        }
        return jwtClaims;
    }
}

module.exports = CryptoHelper;
