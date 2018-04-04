
[![Crowdin](https://d322cqt584bo4o.cloudfront.net/citizenos-fe/localized.svg)](https://crowdin.com/project/citizenos-fe)

# CitizenOS-FE

CitizenOS front-end web application - https://app.citizenos.com.

## Running locally

### Prerequisites

* Node.JS >= 6.13.1 (https://github.com/mklement0/n-install)

### Running

* Get the source - `git clone git@github.com:citizenos/citizenos-fe.git`
* Go to the source directory - `cd citizenos-fe`
* Install dependencies - `npm install`
* Run the application - `npm run dev`
* Add to dev.citizenos.com to your hosts file - `sudo -- sh -c -e "echo '127.0.0.1 dev.citizenos.com' >> /etc/hosts"`
* Open https://dev.citizenos.com:3001 or http://dev.citizenos.com:3000 in your browser.

**NOTES:**

* When using over HTTPS you need to add `./config/certs/dev.citizenos.com.crt` to your trusted CA certificate store or browsers will complain.
* By default the app runs against CitizenOS public testing environment (https://citizenos-citizenos-api-test.herokuapp.com). If you want to run against your local [citizenos-api](https://github.com/citizenos/citizenos-api) instance, modify the url in app.js to https://dev.api.citizenos.com:3003

## Contributing

### Pull requests

* All pull requests to `master` branch
* Live site runs on `prod` branch
