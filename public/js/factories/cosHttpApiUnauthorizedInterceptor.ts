import * as angular from 'angular';
angular
    .module('citizenos')
    .factory('cosHttpApiUnauthorizedInterceptor', ['$log', '$q', '$window', 'sLocation', function ($log, $q, $window, sLocation) {
        $log.debug('citizenos.factory.cosHttpApiUnauthorizedInterceptor');

        var API_REQUEST_REGEX = /\/api\/(?!auth\/status).*/i;

        return {
            'response': function (response) {
                return response;
            },
            'responseError': function (response) {
                if (response.config?.url?.match(API_REQUEST_REGEX) && response.status === 401) {
                    // Cannot use $state here due to circular dependencies with $http
                    $window.location = sLocation.getAbsoluteUrl('/account/login', null, {redirectSuccess: sLocation.getAbsoluteUrl($window.location.pathname) + $window.location.search});
                    return $q.reject();
                }

                return $q.reject(response);
            }
        };

    }]);
