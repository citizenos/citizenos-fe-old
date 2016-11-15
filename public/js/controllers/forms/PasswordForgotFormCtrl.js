'use strict';

angular
    .module('citizenos')
    .controller('PasswordForgotFormCtrl', ['$scope', '$log', '$state', 'ngDialog', 'sTranslate', 'sAuth', function ($scope, $log, $state, ngDialog, sTranslate, sAuth) {
        $log.debug('PasswordForgotFormCtrl');

        $scope.form = {
            email: null
        };

        $scope.errors = null;

        $scope.doPasswordReset = function () {
            $scope.errors = null;

            var success = function (res) {
                $scope.app.doShowNotification($scope.app.notifications.levels.SUCCESS, 'MSG_INFO_PASSWORD_RECOVERY_EMAIL_SENT');
                ngDialog.closeAll(); // Close all dialogs, including this one..
            };

            var error = function (res) {
                sTranslate.errorsToKeys(res, sTranslate.models.USER);
                $scope.errors = res.data.errors;
            };

            sAuth
                .passwordResetSend($scope.form.email)
                .then(success, error);
        };

    }]);
