'use strict';

angular
    .module('citizenos')
    .service('sUser', ['$http', 'sLocation', function ($http, sLocation) {
        var sUser = this;

        var defaultSuccess = function (response) {
            return response.data.data;
        };

        var defaultError = function (response) {
            return $q.reject(response);
        };

        sUser.update = function (name, email, password, company, imageUrl, language, termsVersion) {
            var path = sLocation.getAbsoluteUrlApi('/api/users/self');
            var userData = {
                name: name,
                email: email,
                company: company,
                imageUrl: imageUrl,
                language: language,
                termsVersion: termsVersion
            };

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

        // Map UserConnections.connectionId to authentication method
        sUser.USER_CONNECTION_IDS_TO_AUTH_METHOD_MAP = {
            esteid: ['mobiilId', 'idCard', 'smartId'], // TODO: We should fix it properly on API/FE side - mapping of PID to auth methods
            smartid: ['mobiilId', 'idCard', 'smartId'], // TODO: We should fix it properly on API/FE side - mapping of PID to auth methods
            google: 'google',
            facebook: 'facebook',
            citizenos: 'citizenos'
        };

        sUser.listUserConnections = function (userId) {
            var path = sLocation.getAbsoluteUrlApi('/api/users/:userId/userconnections', {userId: userId});

            return $http.get(path).then(defaultSuccess, defaultError);
        };

    }]);
