'use strict';

angular
    .module('citizenos')
    .controller('PasswordResetFormCtrl', ['$scope', '$log', '$state', '$stateParams', 'ngDialog', 'sAuth', 'sNotification', function ($scope, $log, $state, $stateParams, ngDialog, sAuth, sNotification) {
        $log.debug('PasswordResetFormCtrl');

        $scope.form = {
            password: null
        };

        $scope.passwordResetEmail = $stateParams.email;

        $scope.errors = null;

        $scope.doPasswordReset = function () {
            $scope.errors = null;

            var success = function () {
                $state
                    .go('account.login', {email: $scope.passwordResetEmail})
                    .then(function () {
                        sNotification.addInfo('MSG_INFO_PASSWORD_RESET_SUCCESS');
                    });
            };

            var error = function (res) {
                if (res.data.errors) { // Field errors
                    $scope.errors = res.data.errors;
                }
            };

            if ($scope.form.password) {
                if ($scope.form.password !== $scope.form.passwordConfirm) {
                    $scope.errors = {
                        password: 'MSG_ERROR_PASSWORD_MISMATCH'
                    };
                    return;
                }
            }

            sAuth
                .passwordReset($stateParams.email, $scope.form.password, $stateParams.passwordResetCode)
                .then(success, error);
        };

    }]);
