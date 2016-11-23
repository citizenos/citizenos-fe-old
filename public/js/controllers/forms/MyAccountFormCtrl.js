'use strict';

angular
    .module('citizenos')
    .controller('MyAccountFormCtrl', ['$scope', '$log', '$stateParams', '$filter', 'ngDialog', 'sTranslate', 'sAuth', 'sUser', function ($scope, $log, $stateParams, $filter, ngDialog, sTranslate, sAuth, sUser) {
        $log.debug('MyAccountFormCtrl');

        $scope.form = {
            name: null,
            email: null,
            password: null,
            company: null,
            imageUrl: null
        };
        angular.extend($scope.form, sAuth.user);

        $scope.doUpdateProfile = function () {
            $scope.errors = null;

            var success = function (res) {
                angular.extend(sAuth.user, res.data.data);
                ngDialog.closeAll(); // Close all dialogs, including the one open now...
            };

            var error = function (res) {
                sTranslate.errorsToKeys(res, sTranslate.models.USER);
                $scope.errors = res.data.errors;
            };

            sUser
                .update($scope.form.name, $scope.form.email, $scope.form.password, $scope.form.company)
                .then(success, error);
        };

    }]);
