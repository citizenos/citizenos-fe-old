'use strict';

angular
    .module('citizenos')
    .service('sUser', ['$http', 'sLocation', function ($http, sLocation) {
        var sUser = this;

        sUser.update = function (name, email, password, company, imageUrl, language, termsVersion) {
            var path = sLocation.getAbsoluteUrlApi('/api/users/self');
            var userData = {
                name: name,
                email: email,
                company: company,
                imageUrl: imageUrl,
                language: language,
                termsVersion: termsVersion
            }
            console.log('USER', userData);
            if (password) {
                userData.password = password;
            }
            return $http.put(path, userData);
        };

        sUser.updateLanguage = function (language) {
            var path = sLocation.getAbsoluteUrlApi('/api/users/self');
            return $http.put(path, {language: language});
        };

        sUser.updateTermsVersion = function (termsVersion) {
            var path = sLocation.getAbsoluteUrlApi('/api/users/self');
            return $http.put(path, {termsVersion: termsVersion});
        };

        sUser.deleteUser = function () {
            var path = sLocation.getAbsoluteUrlApi('/api/users/self');
            return $http.delete(path);
        };

        sUser.consentsCreate = function (partnerId) {
            var path = sLocation.getAbsoluteUrlApi('/api/users/self/consents');

            return $http.post(path, {partnerId: partnerId});
        };

    }]);
