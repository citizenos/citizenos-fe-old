angular
    .module('citizenos')
    .service('sLocation', ['$log', '$location', 'cosConfig', function ($log, $location, cosConfig) {
        var sLocation = this;

        sLocation.getBaseUrl = function () {
            return $location.protocol + "//" + $location.hostname + ($location.port ? ':' + $location.port : '');
        };

        /**
         * Get absolute url for API call
         *
         * @param {string} path /some/path/:param1
         * @param {Object} [params] An object containing properties mapped to the named route "parameters".
         * @param {Object} [query] An object containing a property for each query string parameter in the route.
         */
        sLocation.getAbsoluteUrlApi = function (path, params, query) {
            var baseUrlApi = cosConfig.api.baseUrl;

            if (params) {
                Object.keys(params).forEach(function (key) {
                    path = path.replace(':' + key, params[key]);
                });
            }

            var queryString = '';
            if (query) {
                Object.keys(query).forEach(function (key) {
                    queryString += key + '=' + encodeURIComponent(query[key]) + '&';
                });
                if (queryString.length) {
                    queryString = '?' + queryString.slice(0, -1);
                }
            }

            return baseUrlApi + path + queryString;
        };

    }]);
