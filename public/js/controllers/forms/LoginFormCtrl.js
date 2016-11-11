'use strict';

angular
    .module('citizenos')
    .controller('LoginFormCtrl', ['$scope', '$log', '$state', '$window', 'ngDialog', 'sAuth', 'sTranslate', 'sLocation', function ($scope, $log, $state, $window, ngDialog, sAuth, sTranslate, sLocation) {
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

        $scope.doLogin = function () {
            $log.debug('LoginFormCtrl.doLogin()');

            $scope.errors = null;

            var success = function (response) {
                ngDialog.closeAll(); // FIXME: Land on the same page login was started from
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
                    case 40002: // Account has not been verified
                        $scope.app.doShowNotification($scope.app.notifications.levels.INFO, 'MSG_INFO_ACCOUNT_NOT_VERIFIED');
                        break;
                    default:
                        sTranslate.errorsToKeys(response, sTranslate.models.USER);
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

            var path = '/api/auth/:partnerId';
            var redirectSuccess = $state.href($state.current.name, $state.params, {absolute: true});

            $window.location.href = sLocation.getAbsoluteUrlApi(path, {partnerId: partnerId}, {redirectSuccess: redirectSuccess});
        };


        /**
         * Login with Estonian ID-Card
         */
        $scope.doLoginEsteId = function () {
            ngDialog
                .open({
                    template: '/views/modals/login_esteid.html'
                });
        };

    }]);
