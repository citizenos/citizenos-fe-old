'use strict';

angular
    .module('citizenos')
    .service('sAuth', ['$http', '$q', '$log', 'sLocation', function ($http, $q, $log, sLocation) {
        var sAuth = this;

        sAuth.user = {
            loggedIn: false,
            isLoading: true
        };

        var defaultSuccess = function (response) {
            return response.data;
        };

        var defaultError = function (response) {
            return $q.reject(response);
        };

        sAuth.signUp = function (email, password, name, company, redirectSuccess) {
            var data = {
                email: email,
                password: password,
                name: name,
                company: company,
                redirectSuccess: redirectSuccess
            };

            var path = sLocation.getAbsoluteUrlApi('/api/auth/signup');
            return $http.post(path, data).then(defaultSuccess, defaultError);
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

            var path = sLocation.getAbsoluteUrlApi('/api/auth/login');
            return $http.post(path, data).then(success, defaultError);
        };

        sAuth.logout = function () {
            var success = function (response) {
                // Delete all user data except login status.
                // Cant reference a new object here as Angular looses bindings.
                angular.forEach(sAuth.user, function (value, key) {
                    if (key !== 'loggedIn') {
                        delete sAuth.user[key];
                    }
                });
                sAuth.user.loggedIn = false;
                return response;
            };

            var path = sLocation.getAbsoluteUrlApi('/api/auth/logout');
            return $http.post(path).then(success, defaultError);
        };


        sAuth.status = function () {
            var success = function (response) {
                $log.debug('sAuth.status', response);
                angular.extend(sAuth.user, response.data.data);
                sAuth.user.loggedIn = true;
                sAuth.user.isLoading = false;
                return response.data.data;
            };

            var error = function (response) {
                sAuth.user.isLoading = false;
                return defaultError(response);
            };

            var path = sLocation.getAbsoluteUrlApi('/api/auth/status');
            return $http.get(path).then(success, error);
        };

    }]);
