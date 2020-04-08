
[![Build Status](https://travis-ci.org/citizenos/citizenos-fe.svg?branch=master)](https://travis-ci.org/citizenos/citizenos-fe)
[![Crowdin](https://d322cqt584bo4o.cloudfront.net/citizenos-fe/localized.svg)](https://crowdin.com/project/citizenos-fe)


# CitizenOS-FE

CitizenOS front-end web application - https://app.citizenos.com.

## Running

### Prerequisites

* Node.JS >= 6.13.1 (https://github.com/mklement0/n-install)

### Installing

* Get the source - `git clone git@github.com:citizenos/citizenos-fe.git`
* Go to the source directory - `cd citizenos-fe`
* **DEV ONLY** Add to dev.citizenos.com to your hosts file - `sudo -- sh -c -e "echo '127.0.0.1 dev.citizenos.com' >> /etc/hosts"`
* **DEV ONLY** When using over HTTPS you need to add `./config/certs/citizenosCARoot.pem` to your trusted CA certificate store or browsers will complain.

### Running

* Set `NODE_ENV` environment variable:
    * Production - `production`
    * Test - `test`
    * Development/local - `development`
* Run the application:
    * Production/test - `node ./bin/www`. Note that Heroku and some other cloud envs pick up the starting point from `Procfile` (https://github.com/citizenos/citizenos-fe/blob/master/Procfile.txt)
    * Development - `npm run dev`
* Open 
    * Production/test - your configured public app url.
    * Development - https://dev.citizenos.com:3001 or http://dev.citizenos.com:3000 in your browser.

**NOTES:**

* By default the app runs against CitizenOS public testing environment (https://test.api.citizenos.com). If you want to run against your local [citizenos-api](https://github.com/citizenos/citizenos-api) instance, modify the url in app.js to https://dev.api.citizenos.com:3003

## Contributing

### Pull requests

* All pull requests to `master` branch
* Live site runs on `prod` branch
