'use strict';

angular
    .module('citizenos')
    .controller('AddEmailCtrl', ['$scope', '$log', '$state', '$cookies', 'ngDialog', 'sAuth', 'sUser', 'sNotification', function ($scope, $log, $state, $cookies, ngDialog, sAuth, sUser, sNotification) {
        $log.debug('AddEmailCtrl');
        $scope.form = {
            email: null,
            password: null
        };
        // We don't want that after closing browser tab or window any other user could possibly access the login-flow and add their e-mail to other user account
        $cookies.put('addEmailInProgress', true);

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
                $scope.errors = {email: true}
            }

        }

        $scope.logout = function () {
            sAuth
            .logout()
            .then(function () {
                // Reload because the sAuthResolve would not update on logout causing the login screen to redirect to "home" thinking User is logged in
                return $state.go('account.login');
            });
        }
    }]);
