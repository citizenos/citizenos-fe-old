'use strict';

angular
    .module('citizenos')
    .controller('MyAccountFormCtrl', ['$scope', '$log', '$stateParams', '$document', '$window', 'ngDialog', 'sNotification', 'sAuth', 'sUser', 'sUpload', function ($scope, $log, $stateParams, $document, $window, ngDialog, sNotification, sAuth, sUser, sUpload) {
        $log.debug('MyAccountFormCtrl');

        $scope.tabSelected = 'profile';
        $scope.form = {
            name: null,
            email: null,
            password: null,
            company: null,
            imageUrl: null,
            passwordConfirm: null,
            preferences: {
                showInSearch: false
            }
        };

        $scope.imageFile = null;
        angular.extend($scope.form, sAuth.user);

        $scope.doUpdateProfile = function () {
            $scope.errors = null;

            var success = function (res) {
                // E-mail address was changed!
                var emailChanged = sAuth.user.email !== $scope.form.email;
                angular.extend(sAuth.user, res.data.data);
                ngDialog.closeAll(); // Close all dialogs, including the one open now...
                if (emailChanged) {
                    sNotification.addInfo('MSG_INFO_CHECK_EMAIL_TO_VERIFY_YOUR_NEW_EMAIL_ADDRESS');
                }
            };

            var error = function (res) {
                $scope.errors = res.data.errors;
            };

            if ($scope.form.password) {
                if ($scope.form.password !== $scope.form.passwordConfirm) {
                    $scope.errors = {
                        password: 'MSG_ERROR_PASSWORD_MISMATCH'
                    };
                    return;
                }
            }

            if ($scope.imageFile) {
                sUpload
                    .upload($scope.imageFile, 'users')
                    .then(function (url) {
                        $scope.form.imageUrl = url;
                        sUser
                            .update($scope.form.name, $scope.form.email, $scope.form.password, $scope.form.company, url, $scope.form.settings)
                            .then(success, error);
                    });

            } else {
                sUser
                    .update($scope.form.name, $scope.form.email, $scope.form.password, $scope.form.company, $scope.form.imageUrl, $scope.form.settings)
                    .then(success, error);
            }
        };

        $scope.uploadImage = function () {
            $document[0].getElementById('profileImage').click();
        };

        $scope.switchImage = function (element) {
            $scope.imageFile = element.files[0];
            var reader = new FileReader();
            reader.onload = (function () {
                return function (e) {
                    $scope.$apply(function () {
                        $scope.form.imageUrl = e.target.result;
                    });
                };
            })();
            reader.readAsDataURL(element.files[0]);
        };

        $scope.deleteProfileImage = function () {
            if ($scope.form.imageUrl.indexOf('amazonaws') > -1) {
                sUpload.delete($scope.form.imageUrl, 'users')
                    .then(function () {
                        sUser
                            .update($scope.form.name, $scope.form.email, $scope.form.password, $scope.form.company, '')
                            .then(
                                function (res) {
                                    angular.extend(sAuth.user, res.data.data);
                                },
                                function (res) {
                                    $scope.errors = res.data.errors;
                                }
                            );
                    });
            }
        };

        $scope.selectTab = function (tab) {
            $scope.tabSelected = tab;
        }

        $scope.doDeleteAccount = function () {
            ngDialog.openConfirm({
                template: '/views/modals/user_delete_confirm.html',
                data: $stateParams,
                scope: $scope, // Pass on $scope so that I can access AppCtrl,
                closeByEscape: false,
                closeByNavigation: false
            })
            .then(
                function () {
                    sUser
                        .deleteUser()
                        .then(function () {
                            return sAuth
                                .logout();
                        })
                        .then(function () {
                            $window.location.href = '/';
                        });
                }
            );
        }

    }]);
