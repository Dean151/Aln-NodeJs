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

  // Disable or enable console.logs outputs
  'debug_mode': false,

  // Local port to set in nginx reverse proxy
  'local_port': 3000,
  // Port that will be called by the feeder (defined by the iptables rule that redirect the feeder calls)
  'feeder_port': 9999,

  // Mysql settings
  'mysql_host': 'localhost',
  'mysql_port': 3306,
  'mysql_user': 'alnpet',
  'mysql_password': 'Password1234!',
  'mysql_database': 'alnpet',

  // Session settings
  'session_name': 'connect.sid',
  'session_secret': '',

  // Feeder emulator settings
  'enable_emulator': false, // If we want to emulate a feeder to use with the original API.
  'emulator_ip': undefined, // Optional ; To whom should the emulated feeder communicate to
  'emulator_port': undefined, // Optional ; To whom should the emulated feeder communicate to
  'emulator_identifier': 'XXX012345678', // The identifier that will be used for the emulated feeder. Emulation allow to use the original app with a fake feeder.
  'empty_emulator': false, // Set as true if you want to simulate an emulator empty of any food.

  /* DEPRECATED SETTINGS BELOW */

  // API settings: DEPRECATED!
  'api_secret': '', // Generate here a random ; and strong (at least 256bits) string that should not be given to anyone!

  // Feeder filters DEPRECATED
  'feeder_mode': 'none', // Could be "blacklist" or "whitelist"
  'feeder_list': [], // The list of IPs that will be blacklisted or whitelisted (ie ::ffff:8.8.8.8)
};
