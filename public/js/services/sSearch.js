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
         * @param {string|array} [include] Properties to include in the result
         * @param {number} [limit] Limit of results
         * @param {string} [page] Page number for pagination
         *
         * @returns {HttpPromise} Angular $http promise
         */
        sSearch.searchV2 = function (str, include, limit, page) {
            $log.debug('sSearch.searchV2()', str);
            var params = {str: str};
            var path = sLocation.getAbsoluteUrlApi('/api/v2/search');

            if (include) {
                if (!Array.isArray(include)) {
                    include = [include];
                }
                params.include = include;
            }

            if (limit) {
                params.limit = limit;
            }

            if (page) {
                params.page = page;
            }

            // Cancel all pending requests, there is no need to many in parallel as used in TypeAhead.
            if (searchV2PendingDefer) {
                searchV2PendingDefer.resolve('cancelled');
            }

            searchV2PendingDefer = $q.defer();

            return $http.get(path, {timeout: searchV2PendingDefer.promise, params: params});
        };

    }]);
