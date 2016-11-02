'use strict';

angular
    .module('citizenos')
    .controller('SignUpFormCtrl', ['$scope', '$log', '$stateParams', 'ngDialog', function ($scope, $log, $stateParams, ngDialog) {
        $log.debug('SignUpFormCtrl');

        $scope.form = {
            name: null,
            email: null,
            password: null,
            company: null,
            redirectSuccess: null
        };

        // Direct links will have parameters in $stateParams, Login form will pass the "data" when opening the dialog.
        angular.extend($scope.form, $stateParams, $scope.$parent.ngDialogData);

        $scope.errors = null;

        $scope.doSignUp = function () {
            $log.debug('SignUpFormCtrl.doSignUp()');

            $scope.app.user.loggedIn = true;
            ngDialog.closeAll();
        };

    }]);
