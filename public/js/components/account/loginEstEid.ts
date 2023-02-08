'use strict';
import * as angular from 'angular';

let loginEstEid = {
    selector: 'loginEstEid',
    templateUrl: '/views/components/account/login_esteid.html',
    bindings: {},
    controller: ['$log', '$state', '$stateParams', 'cosConfig', 'hwcrypto', '$window', '$timeout', 'sLocation', 'sAuth', 'sNotification', '$q', 'AppService', class LoginEstEIdController {
        private pid;
        private phoneNumber;
        private challengeID;
        private isLoading =  false;
        private isLoadingIdCard = false;
        private authMethodsAvailable;

        private errors;
        constructor (private $log, private $state, private $stateParams, cosConfig,  private hwcrypto, private $window, private $timeout, private sLocation, private sAuth, private sNotification, private $q, private app) {
            this.authMethodsAvailable = angular.extend({}, cosConfig.features.authentication);
        }

        authMobiilId () {
            this.$log.debug('LoginEstEIdController.doLoginMobiilId()');

            this.isLoading = true;

            this.sAuth
                .loginMobiilIdInit(this.pid, this.phoneNumber, this.$stateParams.userId)
                .then((loginMobileIdInitResult) => {
                    this.challengeID = loginMobileIdInitResult.challengeID;
                    const token = loginMobileIdInitResult.token;

                    return this.pollMobiilIdLoginStatus(token, 3000, 80);
                })
                .then(() => {
                    this.handleLoginSuccess();
                }, (err) => {
                    this.$log.error('Something failed when trying to log in with mobile', err);
                    this.isLoading = false;
                    this.challengeID = null;
                });
        };

        authIdCard () {
            this.$log.debug('LoginEstEIdController.doLoginIdCard()');

            this.isLoadingIdCard = true;

            this.hwcrypto
                .getCertificate({language: this.$stateParams.language || 'en'})
                .then(() => {
                    this.sAuth
                    .loginIdCard(this.$stateParams.userId)
                    .then(() => {
                        this.handleLoginSuccess();
                    }, (err) => {
                        this.$log.error('Something failed when trying to log in with card', err);

                        this.isLoadingIdCard = false;
                    });
                }, (err) => {
                    this.isLoadingIdCard = false;
                    let message = err.message
                    if (message === 'no_certificates') {
                        message = 'MSG_ERROR_HWCRYPTO_NO_CERTIFICATES';
                    }

                    this.sNotification.addError(message);
                });
        };

        handleLoginSuccess () {
            if (this.$state.is('partners.consent') || this.$state.is('partners.login')) {
                return this.$window.location.href = this.sLocation.getAbsoluteUrlApi('/api/auth/openid/authorize');
            } else {
                if (this.$stateParams.redirectSuccess) {
                    // TODO: I guess checking the URL would be nice in the future...
                    return this.$window.location.href = this.$stateParams.redirectSuccess;
                } else {
                    this.$window.location.reload();
                }
            }
        };

        pollMobiilIdLoginStatus (token, milliseconds, retry) {
            if (!retry) retry = 80;
            if (!retry--) throw new Error('Too many retries');

            return this.$timeout(() => {
                return this.sAuth.loginMobiilIdStatus(token)
                    .then((response) => {
                        const statusCode = response.data.status.code;
                        switch (statusCode) {
                            case 20001:
                                return this.$timeout(() => {
                                    return this.pollMobiilIdLoginStatus(token, milliseconds, retry);
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
    .component(loginEstEid.selector, loginEstEid);
