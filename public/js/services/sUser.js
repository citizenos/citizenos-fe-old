'use strict';

angular
    .module('citizenos')
    .service('sUser', ['$http', 'sLocation', function ($http, sLocation) {
        var sUser = this;

        sUser.update = function (name, email, password, company) {
            var path = sLocation.getAbsoluteUrlApi('/api/users/self');
            return $http.put(path, {name: name, email: email, password: password, company: company});
        };

        //TODO: Should also work with the User.update
        sUser.updateLanguage = function (language) {
            var path = sLocation.getAbsoluteUrlApi('/api/users/self');
            return $http.put(path, {language: language});
        };

    }]);
