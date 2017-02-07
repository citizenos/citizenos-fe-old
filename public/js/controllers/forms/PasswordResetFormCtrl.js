'use strict';

angular
    .module('citizenos')
    .controller('PasswordResetFormCtrl', ['$scope', '$log', '$state', '$stateParams', 'ngDialog', 'sAuth', function ($scope, $log, $state, $stateParams, ngDialog, sAuth) {
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
                        $scope.app.doShowNotification($scope.app.notifications.levels.SUCCESS, 'MSG_INFO_PASSWORD_RESET_SUCCESS');
                    });
            };

            var error = function (res) {
                if (res.data.errors) { // Field errors
                    $scope.errors = res.data.errors;
                } else { // General error
                    $scope.app.doShowNotification($scope.app.notifications.levels.ERROR, res.data.status.message);
                }
            };

            sAuth
                .passwordReset($stateParams.email, $scope.form.password, $stateParams.passwordResetCode)
                .then(success, error);
        };

    }]);
