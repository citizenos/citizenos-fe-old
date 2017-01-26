angular
    .module('citizenos')
    .service('sSearch', ['$http','$log', '$q', 'sLocation', function ($http, $log, $q, sLocation) {
        var sSearch = this;

        sSearch.search = function (str) {
            $log.debug('sSearch.search()', str);
            var path = sLocation.getAbsoluteUrlApi('/api/search'); //@deprecated Use /api/v2/search
            return $http.get(path, {params: {str: str}});
        };

        sSearch.searchV2 = function (str, include, limit, page) {
            $log.debug('sSearch.searchV2()', str);
            var params = {str:str};
            var path = sLocation.getAbsoluteUrlApi('/api/v2/search');
            var timeoutPromise = $q.defer();
            if (include) {
                if(!Array.isArray(include)) {
                    include = [include];
                }
                params.include = include;
            }
            if(limit){
                params.limit = limit;
            }
            if(page){
                params.page = page;
            }

            return $http.get(path, {timeout: timeoutPromise.promise, timeoutPromise: timeoutPromise, params: params});
        };

    }]);
