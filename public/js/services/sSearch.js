angular
    .module('citizenos')
    .service('sSearch', ['$http', '$log', '$q', 'sLocation', function ($http, $log, $q, sLocation) {
        var sSearch = this;

        sSearch.search = function (str) {
            $log.debug('sSearch.search()', str);
            var path = sLocation.getAbsoluteUrlApi('/api/search'); //@deprecated Use /api/v2/search
            return $http.get(path, {params: {str: str}});
        };


        var searchV2PendingDefer;

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
        sSearch.searchV2 = function (str, params) {
            $log.debug('sSearch.searchV2()', str);
            var path = sLocation.getAbsoluteUrlApi('/api/v2/search');


            // Cancel all pending requests, there is no need to many in parallel as used in TypeAhead.
            if (searchV2PendingDefer) {
                searchV2PendingDefer.resolve('cancelled');
            }

            searchV2PendingDefer = $q.defer();

            return $http.get(path, {timeout: searchV2PendingDefer.promise, params: angular.extend({str: str}, params)});
        };

    }]);
