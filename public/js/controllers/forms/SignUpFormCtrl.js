'use strict';

app.controller('SignUpFormCtrl', ['$scope', '$log', 'ngDialog', function ($scope, $log, ngDialog) {
    $log.debug('SignUpFormCtrl');

    $scope.form = {
    };

    $scope.doSignUp = function () {
        $log.debug('SignUpFormCtrl.doSignUp()');

        $scope.app.user.loggedIn = true;
        ngDialog.closeAll();
    };

}]);
