angular
    .module('citizenos')
    .service('sSearch', ['$http','$log', '$q', 'sLocation', function ($http, $log, $q, sLocation) {
        var sSearch = this;

        sSearch.search = function (str) {
            $log.debug('sSearch.search()', str);
            var path = sLocation.getAbsoluteUrlApi('/api/search');
            return $http.get(path, {params: {str: str}});
        };

    }]);
