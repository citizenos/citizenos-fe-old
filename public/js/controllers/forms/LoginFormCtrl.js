'use strict';

angular
    .module('citizenos')
    .controller('LoginFormCtrl', ['$scope', '$log', '$state', '$stateParams', '$window', '$document', '$interval', 'cosConfig', 'ngDialog', 'sAuth', 'sLocation', 'sUser', function ($scope, $log, $state, $stateParams, $window, $document, $interval, cosConfig, ngDialog, sAuth, sLocation, sUser) {
        $log.debug('LoginFormCtrl');

        $scope.LOGIN_PARTNERS = {
            facebook: 'facebook',
            google: 'google'
        };
        $scope.authMethodsAvailable = angular.extend({}, cosConfig.features.authentication);
        $scope.isFormEmailProvided = $scope.$parent.ngDialogData && $scope.$parent.ngDialogData.email;

        var init = function () {
            $scope.form = {
                email: $scope.isFormEmailProvided ? $scope.$parent.ngDialogData.email : null,
                password: null
            };
            $scope.app.showNav = false; // Hide mobile navigation when login flow is started
        };
        init();

        angular.extend($scope.form, $stateParams);

        // UserConnections to know which auth methods to show - https://github.com/citizenos/citizenos-fe/issues/657
        var userConnections = $scope.$parent.ngDialogData ? $scope.$parent.ngDialogData.userConnections : null;
        if (userConnections) {
            var userAuthMethods = [];

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
            Object.keys($scope.authMethodsAvailable).forEach(function (val) {
                $scope.authMethodsAvailable[val] = userAuthMethods.indexOf(val) > -1;
            });
        }

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
                    if ($stateParams.redirectSuccess) {
                        $window.location.href = $stateParams.redirectSuccess;
                    } else {
                        $window.location.reload();
                    }
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

        $scope.doLoginPartner = function (partnerId) {
            // All /widgets/* require pop-up login flow as they are in the iframe
            if ($state.includes('widgets')) {
                $scope.doLoginPartnerPopup(partnerId);
            } else {
                $scope.doLoginPartnerNoPopup(partnerId);
            }
        };

        /**
         * Login with partner
         *
         * @param {string} partnerId String representing the partner. For ex "facebook", "google".
         */
        $scope.doLoginPartnerPopup = function (partnerId) {
            if (_.values($scope.LOGIN_PARTNERS).indexOf(partnerId) < 0) {
                throw new Error('LoginFormCtrl.doLoginPartner()', 'Invalid parameter for partnerId', partnerId);
            }

            var url = sLocation.getAbsoluteUrlApi(
                '/api/auth/:partnerId',
                {
                    partnerId: partnerId
                },
                {
                    redirectSuccess: sLocation.getAbsoluteUrl('/auth/callback'),
                    display: 'popup'
                }
            );

            var redirectSuccess = $stateParams.redirectSuccess || sLocation.currentUrl(); // Final url to land after successful login

            var loginWindow = popupCenter(url, 'CitizenOS Partner Login', 470, 500);

            if ($document[0].documentMode || $window.navigator.userAgent.indexOf('Edge') > -1) {
                var popupCheck = $interval(function () {
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


        // No-popup partner login version. Used for /partners/{partnerId}/login pages where the popup version would add too much extra complexity with the redirect urls.
        // Popup version was initially needed only for the widget logins. Maybe worth making an exception for the widgets and revert everything else to normal.
        $scope.doLoginPartnerNoPopup = function (partnerId) {
            if (_.values($scope.LOGIN_PARTNERS).indexOf(partnerId) < 0) {
                throw new Error('LoginFormCtrl.doLoginPartner()', 'Invalid parameter for partnerId', partnerId);
            }

            var url = sLocation.getAbsoluteUrlApi('/api/auth/:partnerId', {partnerId: partnerId});
            if ($stateParams.redirectSuccess) {
                url += '?redirectSuccess=' + encodeURIComponent($stateParams.redirectSuccess);
            } else {
                var redirectSuccess = sLocation.currentUrl();
                url += '?redirectSuccess=' + redirectSuccess + '?'; // HACK: + '?' avoids digest loop on Angular side for Google callbacks.
            }

            $window.location.href = url;
        };

        /**
         * Login with Estonian ID-Card
         */
        $scope.doLoginEsteId = function () {
            ngDialog
                .open({
                    template: '/views/modals/login_esteid.html',
                    scope: $scope, // Pass on $scope so that I can access AppCtrl
                    data: {
                        authMethodsAvailable: $scope.authMethodsAvailable
                    }
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
