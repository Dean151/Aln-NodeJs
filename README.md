# Aln-NodeJs

Aln-NodeJs is a replacement API to communicate directly with the HoneyGuaridan S25 API.

The original API is absolutly not secure, so it needed a full replacement. ([How anyone could feed my cat](https://blog.thomasdurand.fr/security/iot/2018/01/31/how-anyone-could-feed-my-cat.html))

## Usage

### Overall usage

The api is callable through the routes prefixed by `api`

*Example:* `http(s)://myhost/api/anything`

Every incoming request shall have a few headers informations:

| Key            | Value                       |
|----------------|-----------------------------|
| Accept         | application/json            |
| Content-Type   | application/json            |
| x-access-token | the-secret-key-in-config.js |

### Setting the default feeding amount

This is the amount of food that will be given when you pressed the manual button on the feeder.

**URI:** `POST http(s)://myhost/api/quantity`

**Parameters** : `identifier` and `quantity`

*Example:* To set a default feeding amount of 10 grams.

```
POST http(s)://myhost/api/quantity
{
  "identifier": "XXX012345678",
  "quantity": 10
}
```

*You can set a quantity from 5 grams to 150 grams.*

### Setting the planning for automated meals

You can setup the feeder to trigger regulary up to 10 meals a day with different times and amounts.

**URI:** `POST http(s)://myhost/api/planning`

**Parameters** : `identifier` and `meals`

*Example:* To set three meals of 20 grams each. The time must be UTC time ; adjust accordingly for your timezone. DST is not yet supported.

```
{
  "identifier": "XXX012345678",
  "meals": [
    {"time":{"hours": 8, "minutes": 0}, "quantity": 20},
    {"time":{"hours": 13, "minutes": 0}, "quantity": 20},
    {"time":{"hours": 21, "minutes": 0}, "quantity": 20}
  ]
}
```

*You can set up to 10 meals, and quantity goes from 5 grams to 150 grams.*

### Feeding

You can trigger a new meal by doing just one request!

**URI:** `POST http(s)://myhost/api/feed`

**Parameters** : `identifier` and `quantity`

*Example:* To feed now a meal of 5 grams.

```
POST http(s)://myhost/api/feed
{
  "identifier": "XXX012345678",
  "quantity": 5
}
```

*You can set a quantity from 5 grams to 150 grams.*

## Installation

### NodeJS

This project has been build with NodeJs 9.5.0
You may run this project on a Raspberry Pi, or something that can connect with your Feeder.

### Clone and install dependencies

```
git clone https://github.com/Dean151/Aln-NodeJs.git
cd Aln-NodeJs
npm install
```

### Configuration file

```
# Copy the example
cp config.example.js config.js

# Then edit the data to make it your own
nano config.js
```

### alnpet.com data interception

The HoneyGuaridan S25 create a socket directly with alnpet.com servers. You want to intercept this socket to treat it with this node.js package.

You'll need to configure your network to make the feeders requests redirect to the device that run the program.

Here is an example where your Raspberry Pi is both the wifi router for the feeder, and the program runner:

Append to `/etc/rc.local`, right before `exit 0`:

```
# What's headed to 47.90.203.137:1032 to localhost
iptables -t nat -A PREROUTING -d 47.90.203.137 -p tcp -j DNAT --to-destination 192.168.1.1:1032
```

### Supervisor example configuration

For a use with supervisor on your raspebrry pi, this is an example config to make it happen

```
# /etc/supervisor/conf.d/aln-nodejs.conf

[program:aln-nodejs]
command=/opt/node/bin/node /home/pi/Aln-NodeJs/main.js
```

Then restart supervisor. It should start automatically the package, it's ready to use !
