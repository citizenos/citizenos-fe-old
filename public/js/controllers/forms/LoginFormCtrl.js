'use strict';

angular
    .module('citizenos')
    .controller('LoginFormCtrl', ['$scope', '$log', '$state', '$stateParams', '$window', '$document', '$interval', 'ngDialog', 'sAuth', 'sLocation', 'sNotification', function ($scope, $log, $state, $stateParams, $window, $document, $interval, ngDialog, sAuth, sLocation, sNotification) {
        $log.debug('LoginFormCtrl');

        $scope.LOGIN_PARTNERS = {
            facebook: 'facebook',
            google: 'google'
        };

        var init = function () {
            $scope.form = {
                email: null,
                password: null
            };
            $scope.app.showNav = false; // Hide mobile navigation when login flow is started
        };
        init();

        angular.extend($scope.form, $stateParams, $scope.$parent.ngDialogData);

        var popupCenter = function (url, title, w, h) {
            var userAgent = navigator.userAgent,
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
                left = parseInt(V + (outerWidth - targetWidth) / 2, 10),
                right = parseInt(screenY + (outerHeight - targetHeight) / 2.5, 10),
                features = [];
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

        $scope.doLogin = function () {
            $log.debug('LoginFormCtrl.doLogin()');

            $scope.errors = null;

            var success = function (response) {
                if ($state.is('partners.consent') || $state.is('partners.login')) {
                    return $window.location.href = sLocation.getAbsoluteUrlApi('/api/auth/openid/authorize');
                } else {
                    $window.location.reload();
                }
            };

            var error = function (response) {
                var status = response.data.status;

                switch (status.code) {
                    case 40001: // Account does not exist
                        // Not using $state.go('account.signup') cause $stateParams are exposed in the url and
                        // I don't want password to be there. Found no secret way to pass data to new state.
                        ngDialog.open({
                            template: '/views/modals/sign_up.html',
                            data: $scope.form,
                            scope: $scope // Pass on $scope so that I can access AppCtrl
                        });
                        break;
                    default:
                        $scope.errors = response.data.errors;
                }
            };

            sAuth
                .login($scope.form.email, $scope.form.password)
                .then(success, error);
        };


        /**
         * Login with partner
         *
         * @param {string} partnerId String representing the partner. For ex "facebook", "google".
         */
        $scope.doLoginPartner = function (partnerId) {
            if (_.values($scope.LOGIN_PARTNERS).indexOf(partnerId) < 0) {
                throw new Error('LoginFormCtrl.doLoginPartner()', 'Invalid parameter for partnerId', partnerId);
            }

            var url = sLocation.getAbsoluteUrlApi(
                '/api/auth/:partnerId',
                {
                    partnerId: partnerId
                },
                {
                    redirectSuccess: sLocation.getAbsoluteUrl('/auth/callback')
                }
            );

            var redirectSuccess = $stateParams.redirectSuccess || sLocation.currentUrl(); // Final url to land after successful login

            var loginWindow = popupCenter(url, 'CitizenOS Facebook Login', 470, 500);

            if ($document[0].documentMode || $window.navigator.userAgent.indexOf('Edge') > -1) {
                var popupCheck = $interval(function() {
                    if (loginWindow.closed) {
                        $interval.cancel(popupCheck);
                        $window.focus();
                        sAuth
                            .status()
                            .then(function (user) {
                                if (user) {
                                    $window.location.href = redirectSuccess;
                                }   
                            });
                    }
                }, 250);
            }
            
            var messageHandler = function (message) {
                loginWindow.close();
                $window.focus();
                $window.location.href = redirectSuccess;
            };
            $window.addEventListener('message', messageHandler, false);
        };


        /**
         * Login with Estonian ID-Card
         */
        $scope.doLoginEsteId = function () {
            ngDialog
                .open({
                    template: '/views/modals/login_esteid.html',
                    scope: $scope // Pass on $scope so that I can access AppCtrl
                });
        };

        /**
         * Login with Smart-ID
         */
        $scope.doLoginSmartId = function () {
            ngDialog
                .open({
                    template: '/views/modals/login_smartid.html',
                    scope: $scope // Pass on $scope so that I can access AppCtrl
                });
        };

        /**
         * Password reset
         */
        $scope.doResetPassword = function () {
            ngDialog
                .open({
                    template: '/views/modals/password_forgot.html',
                    scope: $scope // Pass on $scope so that I can access AppCtrl
                });
        };

    }]);
