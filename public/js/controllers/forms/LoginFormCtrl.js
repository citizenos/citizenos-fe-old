'use strict';

app.controller('LoginFormCtrl', ['$scope', '$log', 'ngDialog', function ($scope, $log, ngDialog) {
    $log.debug('LoginFormCtrl', $scope.app);

    $scope.form = {
        email: null,
        password: null
    };

    $scope.doLogin = function () {
        $log.debug('LoginFormCtrl.doLogin()', $scope.app);
        ngDialog.open({
            template: '/views/modals/register.html',
            scope: $scope
        });
    };

}]);
