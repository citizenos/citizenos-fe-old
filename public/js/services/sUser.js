'use strict';

angular
    .module('citizenos')
    .service('sUser', ['$http', '$q', function ($http, $q) {
        var sUser = this;

        sUser.update = function (name, email, password, company) {
            var path = '/api/users/self';

            return $http.put(path, {name: name, email: email, password: password, company: company});
        };

        //TODO: Should also work with the User.update
        sUser.updateLanguage = function (language) {
            var path = '/api/users/self';

            return $http.put(path, {language: language});
        };

    }]);
