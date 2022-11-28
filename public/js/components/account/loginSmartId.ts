'use strict';
import * as angular from 'angular';

let loginSmartId = {
    selector: 'loginSmartId',
    templateUrl: '/views/components/account/login_smartid.html',
    bindings: {},
    controller: ['$log', '$state', '$stateParams', '$window', '$timeout', '$q', 'ngDialog', 'sLocation', 'sAuth', 'AppService', class LoginSmartIdController {
        private pid;
        private countryCode = 'EE';
        private challengeID;
        private isLoading =  false;
        private isLoadingIdCard = false;

        private errors;
        constructor (private $log, private $state, private $stateParams, private $window, private $timeout, private $q, private ngDialog, private sLocation, private sAuth, private app) {
        }

        authSmartId () {
            this.$log.debug('LoginSmartIdController.authSmartId()');

            this.isLoading = true;

            this.sAuth
                .loginSmartIdInit(this.pid, this.countryCode, this.$stateParams.userId)
                .then((loginSmartIdInitResult) => {
                    this.challengeID = loginSmartIdInitResult.challengeID;
                    const token = loginSmartIdInitResult.token;
                    return this.pollSmartIdLoginStatus(token, 3000, 80);
                })
                .then(() => {
                    if (!this.sAuth.user.email) {
                        this.$window.location.reload();
                    } else {
                        this.handleLoginSuccess();
                    }

                }, (err) => {
                    this.$log.error('Something failed when trying to log in with mobile', err);

                    this.isLoading = false;
                    this.challengeID = null;
                });
        };

        handleLoginSuccess () {
            if (this.$state.is('partners.consent') || this.$state.is('partners.login')) {
                return this.$window.location.href = this.sLocation.getAbsoluteUrlApi('/api/auth/openid/authorize');
            } else {
                if (this.$state.params && this.$state.params.redirectSuccess) {
                    // TODO: I guess checking the URL would be nice in the future...
                    return this.$window.location.href = this.$state.params.redirectSuccess;
                } else {
                    this.$window.location.reload();
                }
            }
        };

        pollSmartIdLoginStatus (token, milliseconds, retry) {
            if (!retry) retry = 80;
            if (!retry--) throw new Error('Too many retries');

            return this.$timeout(() => {
                return this.sAuth.loginSmartIdStatus(token)
                    .then((response) => {
                        const statusCode = response.data.status.code;
                        switch (statusCode) {
                            case 20001:
                                return this.$timeout(() => {
                                    return this.pollSmartIdLoginStatus(token, milliseconds, retry);
                                }, milliseconds, false);
                            case 20002:
                                // Existing User logged in
                                return;
                            case 20003:
                                // New User was created and logged in
                                return;
                            default:
                                this.$log.error('Mobile login failed', response);
                                return this.$q.defer().reject(response);
                        }
                    });
            }, milliseconds, false);
        };
    }]
};

angular
    .module('citizenos')
    .component(loginSmartId.selector, loginSmartId);