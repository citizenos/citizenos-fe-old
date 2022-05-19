'use strict';
import * as angular from 'angular';

angular
    .module('citizenos')
    .controller('PasswordForgotFormCtrl', ['$scope', '$log', '$state', 'ngDialog', 'sAuth', 'sNotification', function ($scope, $log, $state, ngDialog, sAuth, sNotification) {
        $log.debug('PasswordForgotFormCtrl');

        $scope.form = {
            email: null
        };

        $scope.errors = null;

        $scope.doPasswordReset = function () {
            $scope.errors = null;

            var success = function (res) {
                ngDialog.closeAll(); // Close all dialogs, including this one..
                sNotification.addInfo('MSG_INFO_PASSWORD_RECOVERY_EMAIL_SENT');
            };

            var error = function (res) {
                $scope.errors = res.data.errors;
            };

            sAuth
                .passwordResetSend($scope.form.email)
                .then(success, error);
        };

    }]);
