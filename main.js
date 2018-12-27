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

// Load configuration
const config = require("./config");

// Make logs a little bit better
if (config.debug_mode) {
  require('log-timestamp');
}
else {
  console.log = function() {};
}

// This will handle database connexions
const DataBaseCoordinator = require("./src/database-coordinator");
let database = new DataBaseCoordinator(config);

// This will handle feeders connexions
const FeederCoordinator = require("./src/feeder-coordinator");
let feederCoordinator = new FeederCoordinator(config, database);

// This will handle the REST API
const Server = require("./src/server");
new Server(config, feederCoordinator, database);

// This is the feeder emulator part
if (config.enable_emulator && config.emulator_identifier) {
  const Emulator = require("./src/models/emulator");
  new Emulator(config.emulator_identifier, config.emulator_ip ? config.emulator_ip : '47.90.203.137', config.emulator_port ? config.emulator_port : 9999);
}
