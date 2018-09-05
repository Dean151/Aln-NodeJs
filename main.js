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

// Make logs a little bit better
require('log-timestamp');

// Load configuration
const config = require("./config");

// This will handle feeders connexions
const FeederCoordinator = require("./src/feeder-coordinator");
var feederCoordinator = new FeederCoordinator();

// This will handle the REST API
const Server = require("./src/server");
var server = new Server(feederCoordinator, config);

// This is the feeder emulator part
if (config.enable_emulator && config.emulator_identifier) {
  const Emulator = require("./src/emulator");
  var emulatedFeeder = new Emulator(config.emulator_identifier)
}
