'use strict';

angular
    .module('citizenos')
    .service('sAuth', ['$http', '$q', '$log', function ($http, $q, $log) {
        var sAuth = this;

        sAuth.user = {
            loggedIn: false,
            isLoading: true
        };

        sAuth.login = function (email, password) {
            angular.extend(sAuth.user, { loggedIn: true, loadlang: false, isLoading: false, id: "2eedafda-2f7f-48e7-9220-d951218f0bc1", name: "Ilmar Tyrk", company: "CitizenOS", language: "et", email: "ilmar.tyrk@gmail.com", imageUrl: null });
        };

        sAuth.status = function () {
            var success = function (response) {
                angular.extend(sAuth.user, response.data.data);
                sAuth.user.loggedIn = true;
                sAuth.user.isLoading = false;
            };

            var error = function (response) {
                sAuth.user.isLoading = false;
                return $q.reject(response);
            };

            return $http.get('/api/auth/status').then(success, error);
        };

    }]);
