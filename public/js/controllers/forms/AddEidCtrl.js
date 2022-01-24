'use strict';

angular
    .module('citizenos')
    .controller('AddEidCtrl', ['$scope', '$log', '$state', '$cookies', 'ngDialog', 'sAuth', 'sUser', 'sNotification', 'cosConfig', function ($scope, $log, $state, $cookies, ngDialog, sAuth, sUser, sNotification, cosConfig) {
        $log.debug('AddEidCtrl');
        $scope.authMethodsAvailable = angular.extend({}, cosConfig.features.authentication);

        $scope.form = {
            email: null,
            password: null
        };

        /**
         * Login with Estonian ID-Card
         */
         $scope.doConnectEsteId = function () {
            ngDialog
                .open({
                    template: '/views/modals/login_esteid.html',
                    controller: 'ConnectEsteIdFormCtrl',
                    scope: $scope, // Pass on $scope so that I can access AppCtrl
                    data: {
                        authMethodsAvailable: $scope.authMethodsAvailable
                    }
                });
        };

        /**
         * Login with Smart-ID
         */
        $scope.doConnectSmartId = function () {
            ngDialog
                .open({
                    controller: 'ConnectSmartIdFormCtrl',
                    template: '/views/modals/login_smartid.html',
                    scope: $scope // Pass on $scope so that I can access AppCtrl
                });
        };

        $scope.doUpdateProfile = function () {
            $scope.errors = null;

            var success = function (res) {
                // E-mail address was changed!
                $cookies.remove('addEmailInProgress');
                angular.extend(sAuth.user, res.data.data);
                sNotification.addInfo('MSG_INFO_CHECK_EMAIL_TO_VERIFY_YOUR_NEW_EMAIL_ADDRESS');
                sAuth.user.loggedIn = true;
                ngDialog.closeAll(); // Close all dialogs, including the one open now...
            };

            var error = function (res) {
                $scope.errors = res.data.errors;
            };

            if ($scope.form.email) {
                sUser
                    .update(sAuth.user.name, $scope.form.email)
                    .then(success, error);
            } else {
                $scope.errors = {email: 'MODALS.ADD_EMAIL_ERROR_MSG_INVALID'}
            }

        }
    }]);
