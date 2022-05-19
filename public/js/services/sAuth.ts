'use strict';
import * as angular from 'angular';

angular
    .module('citizenos')
    .service('sAuth', ['$http', '$q', '$log', '$cookies', 'sLocation', 'cosConfig', function ($http, $q, $log, $cookies, sLocation, cosConfig) {
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

        sAuth.signUp = function (email, password, name, company, redirectSuccess, preferences) {
            var data = {
                email: email,
                password: password,
                name: name,
                company: company,
                redirectSuccess: redirectSuccess,
                preferences: preferences
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

        sAuth.loginMobiilIdInit = function (pid, phoneNumber, userId) {
            var data = {
                pid: pid,
                phoneNumber: phoneNumber,
                userId: userId
            };

            var success = function (response) {
                return response.data.data;
            };

            var path = sLocation.getAbsoluteUrlApi('/api/auth/mobile/init');
            return $http.post(path, data).then(success, defaultError);
        };

        sAuth.loginMobiilIdStatus = function (token) {
            var success = function (response) {
                if ([20002, 20003].indexOf(response.data.status.code) > -1) {
                    sAuth.user.loggedIn = true;
                    angular.extend(sAuth.user, response.data.data);
                }
                return response;
            };

            var path = sLocation.getAbsoluteUrlApi('/api/auth/mobile/status');
            return $http.get(path, {params: {token: token}}).then(success, defaultError);
        };

        sAuth.loginSmartIdInit = function (pid, countryCode, userId) {
            var data = {
                pid: pid,
                countryCode: countryCode,
                userId: userId
            };

            var success = function (response) {
                return response.data.data;
            };


            var path = sLocation.getAbsoluteUrlApi('/api/auth/smartid/init');
            return $http.post(path, data).then(success, defaultError);
        };

        sAuth.loginSmartIdStatus = function (token) {
            var success = function (response) {
                if ([20002, 20003].indexOf(response.data.status.code) > -1) {
                    sAuth.user.loggedIn = true;
                    angular.extend(sAuth.user, response.data.data);
                }
                return response;
            };

            var path = sLocation.getAbsoluteUrlApi('/api/auth/smartid/status');
            return $http.get(path, {params: {token: token}}).then(success, defaultError);
        };

        sAuth.idCardInit = function () {
            return $http.get(cosConfig.features.authentication.idCard.url, {withCredentials: true}); // withCredentials so that client certificate is sent
        };

        sAuth.loginIdCard = function (userId) {
            var success = function (response) {
                $log.debug('Auth.loginId', 'success');
                if ([20002, 20003].indexOf(response.data.status.code) > -1) {
                    sAuth.user.loggedIn = true;
                    angular.extend(sAuth.user, response.data.data);
                }
                return response;
            };

            return sAuth.idCardInit()
                .then(function (response) {
                    if (response.data.data.token) {
                        var path = sLocation.getAbsoluteUrlApi('/api/auth/id');
                        if (userId) {
                            response.data.data.userId = userId;
                        }
                        return $http.get(path, {params: response.data.data});
                    } else {
                        return response;
                    }
                })
                .then(success, defaultError);
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

            var pathLogoutEtherpad = sLocation.getAbsoluteUrlEtherpad('/ep_auth_citizenos/logout');
            var pathLogoutAPI = sLocation.getAbsoluteUrlApi('/api/auth/logout');

            return $http
                .get(pathLogoutEtherpad) // Call Etherpad logout - https://github.com/citizenos/citizenos-fe/issues/676
                .then(function (success, err) {
                    if (err) throw err;
                    return $http.post(pathLogoutAPI);
                })
                .then(success, defaultError);
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

        sAuth.passwordResetSend = function (email) {
            var path = sLocation.getAbsoluteUrlApi('/api/auth/password/reset/send');
            return $http.post(path, {email: email}).then(defaultSuccess, defaultError);
        };

        sAuth.passwordReset = function (email, password, passwordResetCode) {
            var path = sLocation.getAbsoluteUrlApi('/api/auth/password/reset');
            return $http.post(path, {
                email: email,
                password: password,
                passwordResetCode: passwordResetCode
            }).then(defaultSuccess, defaultError);
        };

        sAuth.getUrlPrefix = function () {
            if (sAuth.user.loggedIn) {
                return 'users';
            }
            return null;
        };

        sAuth.getUrlUserId = function () {
            if (sAuth.user.loggedIn) {
                return 'self';
            }
            return null;
        };

    }]);
