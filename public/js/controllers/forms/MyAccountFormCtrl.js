'use strict';

angular
    .module('citizenos')
    .controller('MyAccountFormCtrl', ['$scope', '$log', '$stateParams', '$filter', '$document', 'ngDialog', 'sAuth', 'sUser', 'sUpload', function ($scope, $log, $stateParams, $filter, $document, ngDialog, sAuth, sUser, sUpload) {
        $log.debug('MyAccountFormCtrl');

        $scope.form = {
            name: null,
            email: null,
            password: null,
            company: null,
            imageUrl: null,
            passwordConfirm: null
        };

        $scope.imageFile = null;
        angular.extend($scope.form, sAuth.user);

        $scope.doUpdateProfile = function () {
            $scope.errors = null;

            var success = function (res) {
                angular.extend(sAuth.user, res.data.data);
                ngDialog.closeAll(); // Close all dialogs, including the one open now...
            };

            var error = function (res) {
                $scope.errors = res.data.errors;
            };

            if ($scope.imageFile) {
                sUpload
                    .upload($scope.imageFile, 'users')
                    .then(function (url) {
                            $scope.form.imageUrl = url;
                            sUser
                                .update($scope.form.name, $scope.form.email, $scope.form.password, $scope.form.company, url)
                                .then(success, error);
                        });

            } else {
                sUser
                    .update($scope.form.name, $scope.form.email, $scope.form.password, $scope.form.company, $scope.form.imageUrl)
                    .then(success, error);
            }
        };

        $scope.uploadImage = function () {
            $document[0].getElementById('profileImage').click();
        };

        $scope.switchImage = function (element) {
            $scope.imageFile = element.files[0];
            var reader = new FileReader();
            reader.onload = (function() { return function(e) {
                $scope.$apply(function () {
                    $scope.form.imageUrl = e.target.result;
                });
            };
            })();
            reader.readAsDataURL(element.files[0]);
        };

        $scope.deleteProfileImage = function () {
            if($scope.form.imageUrl.indexOf('amazonaws') > -1) {
                sUpload.delete($scope.form.imageUrl, 'users')
                    .then(function () {
                        sUser
                            .update($scope.form.name, $scope.form.email, $scope.form.password, $scope.form.company, '')
                            .then(function (res) { angular.extend(sAuth.user, res.data.data);}, function (res) { $scope.errors = res.data.errors;})
                    });
            }
        };

    }]);
