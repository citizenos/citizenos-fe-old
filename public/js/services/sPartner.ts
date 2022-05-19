'use strict';
import * as angular from 'angular';

angular
    .module('citizenos')
    .service('sPartner', ['$http', '$q', '$log', 'sLocation', 'cosConfig', function ($http, $q, $log, sLocation, cosConfig) {
        $log.info('sPartner');
        var sPartner = this;

        var defaultSuccess = function (response) {
            return response.data.data;
        };

        var defaultError = function (response) {
            return $q.reject(response);
        };

        sPartner.info = function (partnerId) {
            var path = sLocation.getAbsoluteUrlApi('/api/partners/:partnerId')
                .replace(':partnerId', partnerId);
            return $http.get(path).then(defaultSuccess, defaultError);
        };


    }]);
