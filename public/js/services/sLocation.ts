import * as angular from 'angular';

export class Location {

    constructor (private $log, private $location, private cosConfig) {}
    getBaseUrl () {
        let port;
        if (this.$location.protocol() === 'https' && this.$location.port() !== 443) {
            port = this.$location.port();
        }

        if (this.$location.protocol() === 'http' && this.$location.port() !== 80) {
            port = this.$location.port();
        }

        return this.$location.protocol() + "://" + this.$location.host() + (port ? ':' + port : '');
    };

    /**
     * Get absolute url for API call
     *
     * @param {string} path /some/path/:param1
     * @param {Object} [params] An object containing properties mapped to the named route "parameters".
     * @param {Object} [query] An object containing a property for each query string parameter in the route.
     */

    getAbsoluteUrlApi (path, params, query) {
        const baseUrlApi = this.cosConfig.api.baseUrl;

        return this._getAbsoluteUrl(baseUrlApi, path, params, query);
    };

    getAbsoluteUrlEtherpad (path, params, query) {
        const baseUrlEtherpad = this.cosConfig.etherpad.baseUrl;

        return this._getAbsoluteUrl(baseUrlEtherpad, path, params, query);
    };

    getAbsoluteUrl (path, params, query) {
        const baseUrlApi = this.getBaseUrl();

        return this._getAbsoluteUrl(baseUrlApi, path, params, query);
    };

    currentUrl () {
        const baseUrl = this.getBaseUrl();
        return baseUrl + this.$location.url();
    };

    _getAbsoluteUrl (baseUrl, path, params, query) {

        if (params) {
            Object.keys(params).forEach((key) => {
                path = path.replace(':' + key, params[key]);
            });
        }

        let queryString = '';
        if (query) {
            Object.keys(query).forEach((key) => {
                queryString += key + '=' + encodeURIComponent(query[key]) + '&';
            });
            if (queryString.length) {
                queryString = '?' + queryString.slice(0, -1);
            }
        }

        return baseUrl + path + queryString;
    }

    getLocationHash () {
        return this.$location.hash();
    }
}
angular
    .module('citizenos')
    .service('sLocation', ['$log', '$location', 'cosConfig', Location]);
