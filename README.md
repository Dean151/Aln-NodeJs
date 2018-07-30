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

### Getting the current feeder status

Allow to know if the feeder is currently available, and responding threw the network

**URI:** `POST http(s)://myhost/api/feeders`

**Parameters** : `identifier` and `quantity`

*Example:* To get the current status of the feeders

```
POST http(s)://myhost/api/feeders
{
  "identifier": "XXX012345678",
  "quantity": 10
}
```

Could return:
```
{
  "XXX012345678": {
    "identifier": "XXX012345678",
    "isAvailable": true,
    "lastResponded": "2018-07-30T15:14:35.072Z"
  }
}
```


### Setting the default feeding amount

This is the amount of food that will be given when you pressed the manual button on the feeder.

**URI:** `PUT http(s)://myhost/api/quantity`

**Parameters** : `identifier` and `quantity`

*Example:* To set a default feeding amount of 10 grams.

```
PUT http(s)://myhost/api/quantity
{
  "identifier": "XXX012345678",
  "quantity": 10
}
```

*You can set a quantity from 5 grams to 150 grams.*

### Setting the planning for automated meals

You can setup the feeder to trigger regulary up to 10 meals a day with different times and amounts.

**URI:** `PUT http(s)://myhost/api/planning`

**Parameters** : `identifier` and `meals`

*Example:* To set three meals of 20 grams each. The time must be UTC time ; adjust accordingly for your timezone. DST is not yet supported.

```
PUT http(s)://myhost/api/planning
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

**URI:** `PUT http(s)://myhost/api/feed`

**Parameters** : `identifier` and `quantity`

*Example:* To feed now a meal of 5 grams.

```
PUT http(s)://myhost/api/feed
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

### Supervisor example configuration

```
sudo apt-get install supervisor
```

For a use with supervisor on your raspebrry pi, this is an example config to make it happen

```
# /etc/supervisor/conf.d/aln-nodejs.conf

[program:aln-nodejs]
command=/opt/node/bin/node /home/pi/Aln-NodeJs/main.js
```

Then restart supervisor. It should start automatically the package, it's ready to use !
```
sudo /etc/init.d/supervisor restart
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

### Setup a WiFi from the raspberry Pi (To intercept the feeder stream)

```
sudo apt-get install dnsmasq hostapd

sudo /etc/init.d/dnsmasq stop
sudo /etc/init.d/hostapd stop
```

```
sudo cp /etc/dhcpcd.conf /etc/dhcpcd.conf.orig
sudo nano /etc/dhcpcd.conf
```

###### /etc/dhcpcd.conf
```
interface wlan0
    static ip_address=192.168.4.1/24
```

```
sudo /etc/init.d/dhcpcd restart

sudo mv /etc/dnsmasq.conf /etc/dnsmasq.conf.orig  
sudo nano /etc/dnsmasq.conf
```

###### /etc/dnsmasq.conf
```
interface=wlan0      # Use the require wireless interface - usually wlan0
  dhcp-range=192.168.4.2,192.168.4.20,255.255.255.0,24h
```

```
sudo nano /etc/hostapd/hostapd.conf
```

###### /etc/hostapd/hostapd.conf
```
interface=wlan0
driver=nl80211
ssid=RaspberryPi
hw_mode=g
channel=9
wmm_enabled=0
macaddr_acl=0
auth_algs=1
ignore_broadcast_ssid=0
wpa=2
wpa_passphrase=ASecurePassphraseHere123
wpa_key_mgmt=WPA-PSK
wpa_pairwise=TKIP
rsn_pairwise=CCMP
```

```
sudo nano /etc/default/hostapd
```

Find this commented line and complete it:
```
#DAEMON_CONF=""
DAEMON_CONF="/etc/hostapd/hostapd.conf"
```

```
sudo /etc/init.d/hostapd start
sudo /etc/init.d/dnsmasq start
```

```
sudo nano /etc/sysctl.conf
```

Uncomment the following line:

###### /etc/sysctl.conf
```
net.ipv4.ip_forward=1
```

```
sudo cp rc.local rc.local.orig
sudo nano rc.local
```

Add right before the exit call:

###### /etc/rc.local
```
iptables -t nat -A  POSTROUTING -o eth0 -j MASQUERADE
exit 0
```

Reboot

```
sudo shutdown -r now
```

You may now connect your feeder to your Raspberry Pi network.
It should work fine in the official App.


### alnpet.com data interception

The HoneyGuaridan S25 create a socket directly with alnpet.com servers. You want to intercept this socket to treat it with this node.js package.

You'll need to configure your network to make the feeders requests redirect to the device that run the program.

Here is an example where your Raspberry Pi is both the wifi router for the feeder, and the program runner:

Append to `/etc/rc.local`, right before `exit 0`:

```
# What's headed to 47.90.203.137:1032 to localhost
iptables -t nat -A PREROUTING -d 47.90.203.137 -p tcp -j DNAT --to-destination 192.168.1.1:1032
exit 0
```

Reboot your device: 

```
sudo shutdown -r now
```

From now on, the feeder should appear offline from the official app. Congratulations, you are secure!
Also, the API should recognize the feeder, and be able to interact with it!
