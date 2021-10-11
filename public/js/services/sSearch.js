angular
    .module('citizenos')
    .service('sSearch', ['$http', '$log', '$q', 'sLocation', function ($http, $log, $q, sLocation) {
        var sSearch = this;

        var searchPendingDefer;

        /**
         * Search
         *
         * NOTE: Each new requests cancels previous pending requests.
         *
         * @param {string} str Search string
         * @param {object} params Request parameters {limit, page, include, "my.topic.level"}
         *
         * @returns {HttpPromise} Angular $http promise
         */
        sSearch.search = function (str, params) {
            $log.debug('sSearch.search()', str);
            var path = sLocation.getAbsoluteUrlApi('/api/search');


            // Cancel all pending requests, there is no need to many in parallel as used in TypeAhead.
            if (searchPendingDefer) {
                searchPendingDefer.resolve('cancelled');
            }

            searchPendingDefer = $q.defer();

            return $http.get(path, {timeout: searchPendingDefer.promise, params: angular.extend({str: str}, params)});
        };

    }]);
