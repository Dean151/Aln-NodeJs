#!/bin/sh

/etc/init.d/supervisor stop
letsencrypt certonly renew
/etc/init.d/supervisor start
