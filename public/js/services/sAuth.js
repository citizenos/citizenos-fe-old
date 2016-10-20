'use strict';

app.service('sAuth', ['$http', '$q', '$log', function ($http, $q, $log) {
    var Auth = this;

    Auth.user = {
        loggedIn: false,
        loadlang: false,
        isLoading: true // Have we loaded the User? Needed to prevent UI flickers
    };

    var defaultSuccess = function (response, status, headers, config) {
        console.log('SUCCESS', response, status, headers, config);
        return response.data;
    };

    var defaultError = function (response, status, headers, config) {
        console.log('ERROR', response, status, headers, config);
        return $q.reject(response);
    };

    Auth.signUp = function (email, password, name, company, redirectSuccess) {
        var data = {
            email: email,
            password: password,
            name: name,
            company: company,
            redirectSuccess: redirectSuccess
        };

        return $http.post('/api/auth/signup', data).then(defaultSuccess, defaultError);
    };

    Auth.login = function (email, password) {
        var data = {
            email: email,
            password: password
        };

        var success = function (response) {
            Auth.user.loggedIn = true;
            $log.debug(response.data);
            angular.extend(Auth.user, response.data.data);
            $log.debug(Auth.user);
        };

        return $http.post('/api/auth/login', data).then(success, defaultError);
    };

    Auth.loginMobileInit = function (pid, phoneNumber) {
        var data = {
            pid: pid,
            phoneNumber: phoneNumber
        };

        var success = function (response) {
            $log.debug('Auth.loginMobileIdInit', 'success', response.data.data);
            return response.data.data;
        };

        return $http.post('/api/auth/mobile/init', data).then(success, defaultError);
    };

    Auth.loginMobileStatus = function (token) {
        var success = function (response) {
            $log.debug('Auth.loginMobileIdStatus', 'success');
            if ([20002, 20003].indexOf(response.data.status.code) > -1) {
                Auth.user.loggedIn = true;
                angular.extend(Auth.user, response.data.data);
            }
            return response;
        };

        return $http.get('/api/auth/mobile/status', {params: {token: token}}).then(success, defaultError);
    };

    Auth.loginId = function () {
        var success = function (response) {
            $log.debug('Auth.loginId', 'success');
            if ([20002, 20003].indexOf(response.data.status.code) > -1) {
                Auth.user.loggedIn = true;
                angular.extend(Auth.user, response.data.data);
            }
            return response;
        };

        return $http
            .get('https://id.citizenos.com/authorize', {withCredentials: true}) // withCredentials so that client certificate is sent
            .then(function (response) {
                return $http.post('/api/auth/id', response.data.data);
            })
            .then(success, defaultError);
    };

    Auth.logout = function () {

        var success = function (response) {
            // Delete all user data except login status.
            // Cant reference a new object here as Angular looses bindings.
            angular.forEach(Auth.user, function (value, key) {
                if (key !== 'loggedIn') {
                    delete Auth.user[key];
                }
            });
            Auth.user.loggedIn = false;
        };

        return $http.post('/api/auth/logout').then(success, defaultError);
    };

    Auth.status = function () {

        var success = function (response) {
            angular.extend(Auth.user, response.data.data);
            Auth.user.loggedIn = true;
            Auth.user.isLoading = false;
        };

        var error = function (response, status, headers, config) {
            $log.error(response, status, headers, config);
            Auth.user.isLoading = false;
            return $q.reject(response);
        };

        return $http.get('/api/auth/status').then(success, error);
    };

    Auth.passwordResetSend = function (email) {
        return $http.post('/api/auth/password/reset/send', {email: email}).then(defaultSuccess, defaultError);
    };

    Auth.passwordReset = function (email, password, passwordResetCode) {
        return $http.post('/api/auth/password/reset', {email: email, password: password, passwordResetCode: passwordResetCode}).then(defaultSuccess, defaultError);
    };

}]);
