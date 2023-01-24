'use strict';
import * as angular from 'angular';

let loginFormComponent = {
    selector: 'loginForm',
    templateUrl: '/views/components/account/login.html',
    bindings: {
        email: '@?'
    },
    controller: ['$log', '$state', '$stateParams', '$window', '$document', '$interval', 'cosConfig', 'ngDialog', 'sAuth', 'sLocation', 'sUser', 'sNotification', 'AppService', class LoginFormController {
        public LOGIN_PARTNERS = {
            facebook: 'facebook',
            google: 'google'
        };
        private email;
        public authMethodsAvailable;
        public isFormEmailProvided;
        private linkRegister;
        private form;
        private errors;

        constructor(private $log, private $state, private $stateParams, private $window, private $document, private $interval, private cosConfig, private ngDialog, private sAuth, private sLocation, private sUser, private sNotification, private app) {
            if ($stateParams.email) {
                this.email = $stateParams.email;
            }
            this.authMethodsAvailable = angular.extend({}, cosConfig.features.authentication);
            console.log(cosConfig.features.authentication)
            if ($stateParams.userId) {
                sUser
                    .listUserConnections($stateParams.userId)
                    .then((res) => {
                        Object.keys(this.authMethodsAvailable).forEach((method) => {
                            this.authMethodsAvailable[method] = false;
                            res.rows.forEach((availableMethod) => {
                                if (availableMethod.connectionId === method) {
                                    this.authMethodsAvailable[method] = true;
                                }
                            })
                        });
                    }, (err) => {
                        // If the UserConnection fetch fails, it does not matter, we just don't filter authentication methods
                        $log.warn('Unable to fetch UserConnections for User', err);
                        return;
                    });
            }

            this.isFormEmailProvided = this.email;
            this.linkRegister = sLocation.getAbsoluteUrl('/account/signup');

            this.init();
            // UserConnections to know which auth methods to show - https://github.com/citizenos/citizenos-fe/issues/657
            const userConnections = this.$stateParams ? this.$stateParams.userConnections : null;
            if (userConnections) {
                let userAuthMethods = [];

                if (userConnections.rows.length) {
                    // Check out from the UserConnection.connectionId map which authentication methods apply
                    userConnections.rows.forEach((val) => {
                        userAuthMethods = userAuthMethods.concat(sUser.USER_CONNECTION_IDS_TO_AUTH_METHOD_MAP[val.connectionId]);
                    });

                    // Reduce to unique values
                    userAuthMethods = userAuthMethods.filter((val, i, res) => {
                        return res.indexOf(val) === i;
                    });
                } else {
                    // IF no UserConnections is returned, that is a for an unregistered user, show 'citizenos' auth method.
                    userAuthMethods.push('citizenos');
                }

                // Initially the authMethods that are configured are all available, modify the list so that only those User has available are enabled
                Object.keys(this.authMethodsAvailable).forEach((val) => {
                    this.authMethodsAvailable[val] = userAuthMethods.indexOf(val) > -1;
                });
            }
        }

        init() {
            this.form = {
                email: this.isFormEmailProvided ? this.email : null,
                password: null
            };
            this.app.showNav = false; // Hide mobile navigation when login flow is started
        }

        popupCenter(url, title, w, h) {
            const userAgent = navigator.userAgent,
                mobile = () => {
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
            const right = screenY + (outerHeight - targetHeight) / 2.5;
            const features = [];
            if (targetWidth !== null) {
                features.push('width=' + targetWidth);
            }
            if (targetHeight !== null) {
                features.push('height=' + targetHeight);
            }
            features.push('left=' + left);
            features.push('top=' + right);
            features.push('scrollbars=1');

            const newWindow = window.open(url, title, features.join(','));

            if (window.focus) {
                newWindow.focus();
            }

            return newWindow;
        };

        doLogin() {
            this.$log.debug('LoginFormCtrl.doLogin()');

            this.errors = null;
            const success = (response) => {
                if (this.$state.is('partners.consent') || this.$state.is('partners.login')) {
                    return this.$window.location.href = this.sLocation.getAbsoluteUrlApi('/api/auth/openid/authorize');
                } else {
                    if (this.$stateParams.redirectSuccess) {
                        this.$window.location.href = this.$stateParams.redirectSuccess;
                    } else {
                        this.$window.location = '/';
                    }
                }
            };

            const error = (response) => {
                const status = response.data.status;
                console.log('ERROR', status);

                switch (status.code) {
                    case 40001: // Account does not exist
                        this.sNotification.removeAll();
                        this.errors = { accoundDoesNotExist: true };
                        break;
                    default:
                        this.errors = response.data.errors;
                }
            };

            this.sAuth
                .login(this.form.email, this.form.password)
                .then(success, error);
        };

        /**
         * Login with Estonian ID-Card
         */
        doLoginEsteId() {
            this.ngDialog
                .open({
                    template: '<login-est-eid></login-est-eid>',
                    plain: true
                });
        };

        /**
         * Login with Smart-ID
         */
        doLoginSmartId() {
            this.ngDialog
                .open({
                    template: '<login-smart-id></login-smart-id>',
                    plain: true
                });
        };

        /**
         * Password reset
         */
        doResetPassword() {
            this.ngDialog
                .open({
                    template: '<password-forgot></password-forgot>',
                    plain: true
                });
        };

        doLoginPartner(partnerId) {
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
        doLoginPartnerPopup(partnerId) {
            if (Object.values(this.LOGIN_PARTNERS).indexOf(partnerId) < 0) {
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
                const popupCheck = this.$interval(() => {
                    if (loginWindow.closed) {
                        this.$interval.cancel(popupCheck);
                        this.$window.focus();
                        this.sAuth
                            .status()
                            .then((user) => {
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
        doLoginPartnerNoPopup(partnerId) {
            if (Object.values(this.LOGIN_PARTNERS).indexOf(partnerId) < 0) {
                throw new Error(`LoginFormCtrl.doLoginPartner() Invalid parameter for partnerId ${partnerId}`);
            }

            let url = this.sLocation.getAbsoluteUrlApi('/api/auth/:partnerId', { partnerId: partnerId });
            if (this.$stateParams.redirectSuccess) {
                url += '?redirectSuccess=' + encodeURIComponent(this.$stateParams.redirectSuccess);
            } else {
                const redirectSuccess = this.sLocation.currentUrl();
                url += '?redirectSuccess=' + redirectSuccess + '?'; // HACK: + '?' avoids digest loop on Angular side for Google callbacks.
            }

            this.$window.location.href = url;
        };
    }]
};
angular
    .module('citizenos')
    .component(loginFormComponent.selector, loginFormComponent);
