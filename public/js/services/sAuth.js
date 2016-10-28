'use strict';

angular
    .module('citizenos')
    .service('sAuth', ['$http', '$q', '$log', function ($http, $q, $log) {
        sAuth = this;
        sAuth.user = {
            loggedIn: false,
            isLoading: true
        };
        var defaultSuccess = function (response, status, headers, config) {
            $log.debug('SUCCESS', response, status, headers, config);
            return response.data;
        };

        var defaultError = function (response, status, headers, config) {
            $log.debug('ERROR', response, status, headers, config);
            return $q.reject(response);
        };
        sAuth.login = function (email, password) {
            var data = {
                email: email,
                password: password
            };

            var success = function (response) {
                sAuth.user.loggedIn = true;
                angular.extend(sAuth.user, response.data.data);
            };

            return $http.post('/api/auth/login', data).then(success, defaultError);
        };

        /*sAuth.status = function (){
           return $q(function(resolve, reject) {
               setTimeout(function() {
            //    angular.extend(sAuth.user, { loggedIn: true, loadlang: false, isLoading: false, id: "2eedafda-2f7f-48e7-9220-d951218f0bc1", name: "Ilmar Tyrk", company: "CitizenOS", language: "et", email: "ilmar.tyrk@gmail.com", imageUrl: null });
                   sAuth.user.isLoading = false;
                   resolve(sAuth.user);
               }, 500);
           });
        };*/

        sAuth.status = function () {
            var success = function (response) {
                angular.extend(sAuth.user, response.data.data);
                sAuth.user.loggedIn = true;
                sAuth.user.isLoading = false;
                return $q.resolve(response.data.data);
            };

            var error = function (response, status, headers, config) {
                $log.error(response, status, headers, config);
                sAuth.user.isLoading = false;
                return $q.reject(response);
            };

            return $http.get('/api/auth/status').then(success, error);
        };

    }]);
