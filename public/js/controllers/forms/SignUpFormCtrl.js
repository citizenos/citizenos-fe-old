'use strict';

angular
    .module('citizenos')
    .controller('SignUpFormCtrl', ['$scope', '$log', '$stateParams', '$filter', '$window', 'ngDialog', 'sAuth', 'sNotification', function ($scope, $log, $stateParams, $filter, $window, ngDialog, sAuth, sNotification) {
        $log.debug('SignUpFormCtrl');

        $scope.form = {
            name: null,
            email: null,
            password: null,
            company: null,
            redirectSuccess: null,
            preferences: {
                showInSearch: false
            }
        };

        // Direct links will have parameters in $stateParams, Login form will pass the "data" when opening the dialog.
        angular.extend($scope.form, $stateParams, $scope.$parent.ngDialogData);

        $scope.form.name = $scope.form.name || $filter('emailToDisplayName')($scope.form.email);

        $scope.errors = null;

        $scope.doSignUp = function () {
            $log.debug('SignUpFormCtrl.doSignUp()');

            var success = function (response) {
                ngDialog.closeAll(); // Close all dialogs, including the one open now...
                if (response.data && response.data.redirectSuccess) {
                    $window.location.href = response.data.redirectSuccess;
                } else {
                    sNotification.addInfo('MSG_INFO_CHECK_EMAIL_TO_VERIFY_YOUR_ACCOUNT');
                }
            };

            var error = function (res) {
                $scope.errors = res.data.errors;
            };

            if ($scope.form.password && $scope.form.password !== $scope.form.passwordConfirm) {
                $scope.errors = {
                    password: 'MSG_ERROR_PASSWORD_MISMATCH'
                };
                return;
            } else {
                sAuth
                    .signUp($scope.form.email, $scope.form.password, $scope.form.name, $scope.form.company, $scope.form.redirectSuccess, $scope.form.settings)
                    .then(success, error);
            }
        };

    }]);
