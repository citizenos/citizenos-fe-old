'use strict';
import * as angular from 'angular';
import {values} from 'lodash';

let loginFormComponent =  {
    selector: 'loginForm',
    templateUrl: '/views/modals/login.html',
    bindings: {
        ngDialogData: '='
    },
    controller: ['$log', '$state', '$stateParams', '$window', '$document', '$interval', 'cosConfig', 'ngDialog', 'sAuth', 'sLocation', 'sUser', 'sNotification', 'AppService', class LoginFormController {
        public app;

        public LOGIN_PARTNERS = {
            facebook: 'facebook',
            google: 'google'
        };
        public authMethodsAvailable;
        public isFormEmailProvided;
        private ngDialogData;
        private linkRegister;
        private form;
        private errors;

        constructor (private $log, private $state, private $stateParams, private $window, private $document, private $interval, private cosConfig, private ngDialog, private sAuth, private sLocation, private sUser, private sNotification, AppService) {
            console.log('LoginController')
            this.app = AppService;

            this.authMethodsAvailable = angular.extend({}, cosConfig.features.authentication);
            this.isFormEmailProvided = this.ngDialogData && this.ngDialogData.email;
            this.linkRegister = sLocation.getAbsoluteUrl('/account/signup');

            this.init();
            angular.extend(this.form, $stateParams);

            // UserConnections to know which auth methods to show - https://github.com/citizenos/citizenos-fe/issues/657
            const userConnections = this.ngDialogData ? this.ngDialogData.userConnections : null;
            if (userConnections) {
                let userAuthMethods = [];

                if (userConnections.rows.length) {
                    // Check out from the UserConnection.connectionId map which authentication methods apply
                    userConnections.rows.forEach(function (val) {
                        userAuthMethods = userAuthMethods.concat(sUser.USER_CONNECTION_IDS_TO_AUTH_METHOD_MAP[val.connectionId]);
                    });

                    // Reduce to unique values
                    userAuthMethods = userAuthMethods.filter(function (val, i, res) {
                        return res.indexOf(val) === i;
                    });
                } else {
                    // IF no UserConnections is returned, that is a for an unregistered user, show 'citizenos' auth method.
                    userAuthMethods.push('citizenos');
                }

                // Initially the authMethods that are configured are all available, modify the list so that only those User has available are enabled
                Object.keys(this.authMethodsAvailable).forEach(function (val) {
                    this.authMethodsAvailable[val] = userAuthMethods.indexOf(val) > -1;
                });
            }
        }

        init () {
            this.form = {
                email: this.isFormEmailProvided ? this.ngDialogData.email : null,
                password: null
            };
            this.app.showNav = false; // Hide mobile navigation when login flow is started
        }

        popupCenter (url, title, w, h) {
            const userAgent = navigator.userAgent,
                mobile = function () {
                    return /\b(iPhone|iP[ao]d)/.test(userAgent) ||
                        /\b(iP[ao]d)/.test(userAgent) ||
                        /Android/i.test(userAgent) ||
                        /Mobile/i.test(userAgent);
                },
                screenX = typeof window.screenX != 'undefined' ? window.screenX : window.screenLeft,
                screenY = typeof window.screenY != 'undefined' ? window.screenY : window.screenTop,
                outerWidth = typeof window.outerWidth != 'undefined' ? window.outerWidth : document.documentElement.clientWidth,
                outerHeight = typeof window.outerHeight != 'undefined' ? window.outerHeight : document.documentElement.clientHeight - 22,
                targetWidth = mobile() ? null : w,
                targetHeight = mobile() ? null : h,
                V = screenX < 0 ? window.screen.width + screenX : screenX,
                left = Number(V) + Number(outerWidth - targetWidth) / 2;
                var right = screenY + (outerHeight - targetHeight) / 2.5;
                var features = [];
            if (targetWidth !== null) {
                features.push('width=' + targetWidth);
            }
            if (targetHeight !== null) {
                features.push('height=' + targetHeight);
            }
            features.push('left=' + left);
            features.push('top=' + right);
            features.push('scrollbars=1');

            var newWindow = window.open(url, title, features.join(','));

            if (window.focus) {
                newWindow.focus();
            }

            return newWindow;
        };

        doLogin () {
            this.$log.debug('LoginFormCtrl.doLogin()');

            this.errors = null;
            const success = (response) => {
                if (this.$state.is('partners.consent') || this.$state.is('partners.login')) {
                    return this.$window.location.href = this.sLocation.getAbsoluteUrlApi('/api/auth/openid/authorize');
                } else {
                    if (this.$stateParams.redirectSuccess) {
                        this.$window.location.href = this.$stateParams.redirectSuccess;
                    } else {
                        this.$window.location.reload();
                    }
                }
            };

            var error = function (response) {
                const status = response.data.status;
                console.log('ERROR', status);

                switch (status.code) {
                    case 40001: // Account does not exist
                        this.sNotification.removeAll();
                        this.errors = {accoundDoesNotExist: true};
                        break;
                    default:
                        this.errors = response.data.errors;
                }
            };

            this.sAuth
                .login(this.form.email, this.form.password)
                .then(success, error);
        };

        doLoginPartner (partnerId) {
            // All /widgets/* require pop-up login flow as they are in the iframe
            if (this.$state.includes('widgets')) {
                this.doLoginPartnerPopup(partnerId);
            } else {
                this.doLoginPartnerNoPopup(partnerId);
            }
        };

        /**
         * Login with partner
         *
         * @param {string} partnerId String representing the partner. For ex "facebook", "google".
         */
        doLoginPartnerPopup (partnerId) {
            if (values(this.LOGIN_PARTNERS).indexOf(partnerId) < 0) {
                throw new Error(`LoginFormCtrl.doLoginPartner() Invalid parameter for partnerId ${partnerId}`);
            }

            const url = this.sLocation.getAbsoluteUrlApi(
                '/api/auth/:partnerId',
                {
                    partnerId: partnerId
                },
                {
                    redirectSuccess: this.sLocation.getAbsoluteUrl('/auth/callback'),
                    display: 'popup'
                }
            );

            const redirectSuccess = this.$stateParams.redirectSuccess || this.sLocation.currentUrl(); // Final url to land after successful login

            const loginWindow = this.popupCenter(url, 'CitizenOS Partner Login', 470, 500);

            if (this.$document[0].documentMode || this.$window.navigator.userAgent.indexOf('Edge') > -1) {
                const popupCheck = this.$interval(function () {
                    if (loginWindow.closed) {
                        this.$interval.cancel(popupCheck);
                        this.$window.focus();
                        this.sAuth
                            .status()
                            .then(function (user) {
                                if (user) {
                                    this.$window.location.href = redirectSuccess;
                                }
                            });
                    }
                }, 250);
            }

            const messageHandler = (message) => {
                loginWindow.close();
                this.$window.focus();
                this.$window.location.href = redirectSuccess;
            };
            this.$window.addEventListener('message', messageHandler, false);
        };

        // No-popup partner login version. Used for /partners/{partnerId}/login pages where the popup version would add too much extra complexity with the redirect urls.
        // Popup version was initially needed only for the widget logins. Maybe worth making an exception for the widgets and revert everything else to normal.
        doLoginPartnerNoPopup (partnerId) {
            if (values(this.LOGIN_PARTNERS).indexOf(partnerId) < 0) {
                throw new Error(`LoginFormCtrl.doLoginPartner() Invalid parameter for partnerId ${partnerId}`);
            }

            var url = this.sLocation.getAbsoluteUrlApi('/api/auth/:partnerId', {partnerId: partnerId});
            if (this.$stateParams.redirectSuccess) {
                url += '?redirectSuccess=' + encodeURIComponent(this.$stateParams.redirectSuccess);
            } else {
                var redirectSuccess = this.sLocation.currentUrl();
                url += '?redirectSuccess=' + redirectSuccess + '?'; // HACK: + '?' avoids digest loop on Angular side for Google callbacks.
            }

            this.$window.location.href = url;
        };

        /**
         * Login with Estonian ID-Card
         */
         doLoginEsteId () {
            this.ngDialog
                .open({
                    template: '/views/modals/login_esteid.html',
                    controller: 'LoginEsteIdFormCtrl',
                    scope: this, // Pass on $scope so that I can access AppCtrl
                    data: {
                        authMethodsAvailable: this.authMethodsAvailable,
                        userId: this.$stateParams.userId
                    }
                });
        };

        /**
         * Login with Smart-ID
         */
        doLoginSmartId () {
            this.ngDialog
                .open({
                    controller: 'LoginSmartIdFormCtrl',
                    template: '/views/modals/login_smartid.html',
                    scope: this, // Pass on $scope so that I can access AppCtrl
                    data: {
                        authMethodsAvailable: this.authMethodsAvailable,
                        userId: this.$stateParams.userId
                    }
                });
        };

        /**
         * Password reset
         */
        doResetPassword () {
            this.ngDialog
                .open({
                    template: '/views/modals/password_forgot.html',
                    scope: this // Pass on $scope so that I can access AppCtrl
                });
        };
    }]
};
angular
    .module('citizenos')
    .component(loginFormComponent.selector, loginFormComponent);
