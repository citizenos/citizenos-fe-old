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
            $log.debug('sSearch.search()', str);
            var params = {str:str};
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
            var path = sLocation.getAbsoluteUrlApi('/api/v2/search');
            return $http.get(path, {params: params});
        };

    }]);
