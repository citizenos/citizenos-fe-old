'use strict';

angular
    .module('citizenos')
    .service('sUser', ['$http', 'sLocation', function ($http, sLocation) {
        var sUser = this;

        sUser.update = function (name, email, password, company, imageUrl) {
            var path = sLocation.getAbsoluteUrlApi('/api/users/self');
            return $http.put(path, {name: name, email: email, password: password, company: company, imageUrl: imageUrl});
        };

        //TODO: Should also work with the User.update
        sUser.updateLanguage = function (language) {
            var path = sLocation.getAbsoluteUrlApi('/api/users/self');
            return $http.put(path, {language: language});
        };

        sUser.consentsCreate = function (partnerId) {
            var path = sLocation.getAbsoluteUrlApi('/api/users/self/consents');

            return $http.post(path, {partnerId: partnerId});
        };

    }]);
