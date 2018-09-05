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

module.exports = {
  // Local port to set in nginx reverse proxy
  'local_port': 3000,
  // Port that will be called by the feeder (defined by the iptables rule that redirect the feeder calls)
  'feeder_port': 1032,
  
  // API secrets
  'allowed_feeders': ['XXX012345678'], // List here the allowed feeded identifiers that can use the API.
  'api_secret': '', // Generate here a random ; and strong (at least 256bits) string that should not be given to anyone!
};
