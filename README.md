# Aln-NodeJs

![GitHub tag](https://img.shields.io/github/tag/Dean151/Aln-NodeJS.svg)
[![Build Status](https://travis-ci.org/Dean151/Aln-NodeJs.svg?branch=master)](https://travis-ci.org/Dean151/Aln-NodeJs)
![Libraries.io for GitHub](https://img.shields.io/librariesio/github/Dean151/Aln-NodeJS.svg)
[![Twitter](https://img.shields.io/badge/twitter-@deanatoire-blue.svg?style=flat)](https://twitter.com/deanatoire)


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

### Available API Endpoints

| Verb | URL                       | Parameters             | Effect                |
|------|---------------------------|------------------------|-----------------------|
| POST | /api/user/login           | { email: String?, identityToken: base64, authorizationCode: base64 } | Log a user in with Sign in with Apple |
| POST | /api/user/logout          | -                      | Destroy the current user session. |
| POST | /api/user/check           | -                      | Check if the current session correspond to a logged-in user |
| POST | /api/feeder/claim         | { identifier: String } | Claim the ownership of a feeder, after it's been connected to the API for the first time. This request must be sent from the same network the feeder is connected to. |
| GET  | /api/feeder/{id}          | -                      | Check if the feeder is currently reachable. |
| PUT  | /api/feeder/{id}          | { name: String }       | Change the feeder name |
| POST | /api/feeder/{id}/feed     | { quantity: Int }      | Trigger a meal. |
| PUT  | /api/feeder/{id}/quantity | { quantity: Int }      | Change the feeding amount when pressing the machine button. |
| GET  | /api/feeder/{id}/planning | -                      | Get the last setted planning on the machine. |
| PUT  | /api/feeder/{id}/planning | { meals: [{ time: { hours: Int, minutes: Int }, quantity: Int, enabled: Bool }] | Set a new planning in the machine. |

## Installation

### NodeJS

This project has been build with NodeJs 9.5.0
You may run this project on a Raspberry Pi, or something that can connect with your Feeder.

To install nodeJS on a Raspberry Pi:
```
wget -O - https://raw.githubusercontent.com/audstanley/NodeJs-Raspberry-Pi/master/Install-Node.sh | sudo bash;
```


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

### Starting the process with PM2

```
npm install pm2@latest -g
pm2 start main.js --name alnpet
```


### Nginx reverse proxy to make things work

Install nginx

```
sudo apt-get install nginx
```

Make rights correct for pi user

```
$ sudo usermod -a -G www-data pi
$ sudo chown -R www-data:www-data /var/www
$ sudo chmod -R g+rwX /var/www
```

Then configure the reverse proxy to work along with NodeJS

```
sudo mv /etc/nginx/default /etc/nginx/default.orig
sudo nano /etc/nginx/default
```

###### /etc/nginx/default
```
server {
  listen 80 default_server;
  listen [::]:80 default_server;

  root /var/www/html;

  location /api {
    proxy_pass http://localhost:3000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
  }
}
```

Now reload nginx configuration
```
sudo nginx -s reload
```

The API should be available at your Raspberry Pi IP. We now need to connect the feeder to it!

Note: it is recommended that you configure HTTPS connexion via TLS (LetsEncrypt would do that for you).

### Configure the cat feeder

First, identify the local IP of your feeder, using the connected devices table from your router interface.

Then, browse to this IP in your navigator (http://192.168.1.x) and enter the username and password :

```
username: admin
password: admin
```

Don't touch any of the settings without knowing exactly what you're talking about.
You may want to change the language from chinese to english in the top right corner.

We just want to change the URL the feeder will talk to.

####Work In Progress...
