'use strict';
import * as angular from 'angular';

export class Auth {
    private user = {
        loggedIn: false,
        isLoading: true
    };

    private defaultSuccess = (response) => {
        return response.data;
    };

    private defaultError = (response) => {
        return this.$q.reject(response);
    };

    constructor (private $http, private $q, private $log, private sLocation, private cosConfig) {}

    signUp (email, password, name, company, redirectSuccess, preferences, termsVersion) {
        const data = {
            email: email,
            password: password,
            name: name,
            company: company,
            redirectSuccess: redirectSuccess,
            preferences: preferences,
            termsVersion: termsVersion
        };

        const path = this.sLocation.getAbsoluteUrlApi('/api/auth/signup');

        return this.$http.post(path, data).then(this.defaultSuccess,this.defaultError);
    };

    login (email, password) {
        const data = {
            email: email,
            password: password
        };

        const success = (response) => {
            this.user.loggedIn = true;
            angular.extend(this.user, response.data.data);
        };

        const path = this.sLocation.getAbsoluteUrlApi('/api/auth/login');

        return this.$http.post(path, data).then(success, this.defaultError);
    };

    loginMobiilIdInit (pid, phoneNumber, userId) {
        const data = {
            pid: pid,
            phoneNumber: phoneNumber,
            userId: userId
        };

        const success = (response) => {
            return response.data.data;
        };

        const path = this.sLocation.getAbsoluteUrlApi('/api/auth/mobile/init');

        return this.$http.post(path, data).then(success, this.defaultError);
    };

    loginMobiilIdStatus (token) {
        const success = (response) => {
            if ([20002, 20003].indexOf(response.data.status.code) > -1) {
                this.user.loggedIn = true;
                angular.extend(this.user, response.data.data);
            }
            return response;
        };

        const path = this.sLocation.getAbsoluteUrlApi('/api/auth/mobile/status');

        return this.$http.get(path, {params: {token: token}}).then(success, this.defaultError);
    };

    loginSmartIdInit (pid, countryCode, userId) {
        const data = {
            pid: pid,
            countryCode: countryCode,
            userId: userId
        };

        const success = (response) => {
            return response.data.data;
        };


        const path = this.sLocation.getAbsoluteUrlApi('/api/auth/smartid/init');

        return this.$http.post(path, data).then(success, this.defaultError);
    };

    loginSmartIdStatus (token) {
        const success = (response) => {
            if ([20002, 20003].indexOf(response.data.status.code) > -1) {
                this.user.loggedIn = true;
                angular.extend(this.user, response.data.data);
            }
            return response;
        };

        const path = this.sLocation.getAbsoluteUrlApi('/api/auth/smartid/status');

        return this.$http.get(path, {params: {token: token}}).then(success, this.defaultError);
    };

    idCardInit () {
        return this.$http.get(this.cosConfig.features.authentication.idCard.url, {withCredentials: true}); // withCredentials so that client certificate is sent
    };

    loginIdCard (userId?) {
        const success = (response) => {
            this.$log.debug('Auth.loginId', 'success');
            if ([20002, 20003].indexOf(response.data.status.code) > -1) {
                this.user.loggedIn = true;
                angular.extend(this.user, response.data.data);
            }
            return response;
        };

        return this.idCardInit()
            .then((response) => {
                if (response.data.data.token) {
                    const path = this.sLocation.getAbsoluteUrlApi('/api/auth/id');
                    if (userId) {
                        response.data.data.userId = userId;
                    }
                    return this.$http.get(path, {params: response.data.data});
                } else {
                    return response;
                }
            })
            .then(success, this.defaultError);
    };

    logout () {
        const success = (response) => {
            // Delete all user data except login status.
            // Cant reference a new object here as Angular looses bindings.
            angular.forEach(this.user, (value, key) => {
                if (key !== 'loggedIn') {
                    delete this.user[key];
                }
            });
            this.user.loggedIn = false;

            return response;
        };

        const pathLogoutEtherpad = this.sLocation.getAbsoluteUrlEtherpad('/ep_auth_citizenos/logout');
        const pathLogoutAPI = this.sLocation.getAbsoluteUrlApi('/api/auth/logout');

        return this.$http
            .get(pathLogoutEtherpad) // Call Etherpad logout - https://github.com/citizenos/citizenos-fe/issues/676
            .then((success, err) => {
                if (err) throw err;
                return this.$http.post(pathLogoutAPI);
            })
            .then(success, this.defaultError);
    };

    status () {
        const success = (response) => {
            this.$log.debug('status', response);
            angular.extend(this.user, response.data.data);
            this.user.loggedIn = true;
            this.user.isLoading = false;

            return response.data.data;
        };

        const error = (response) => {
            this.user.isLoading = false;

            return this.defaultError(response);
        };

        const path = this.sLocation.getAbsoluteUrlApi('/api/auth/status');
        return this.$http.get(path).then(success, error);
    };

    passwordResetSend (email) {
        const path = this.sLocation.getAbsoluteUrlApi('/api/auth/password/reset/send');
        return this.$http.post(path, {email: email}).then(this.defaultSuccess, this.defaultError);
    };

    passwordReset (email, password, passwordResetCode) {
        const path = this.sLocation.getAbsoluteUrlApi('/api/auth/password/reset');
        return this.$http.post(path, {
            email: email,
            password: password,
            passwordResetCode: passwordResetCode
        }).then(this.defaultSuccess, this.defaultError);
    };

    getUrlPrefix () {
        if (this.user.loggedIn) {
            return 'users';
        }
        return null;
    };

    getUrlUserId () {
        if (this.user.loggedIn) {
            return 'self';
        }
        return null;
    };
}
angular
    .module('citizenos')
    .service('sAuth', ['$http', '$q', '$log', 'sLocation', 'cosConfig', Auth]);
