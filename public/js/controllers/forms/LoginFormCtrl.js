'use strict';

app.controller('LoginFormCtrl', ['$scope', '$log', 'ngDialog', function ($scope, $log, ngDialog) {
    $log.debug('LoginFormCtrl', ngDialog);

    $scope.form = {
        email: null,
        password: null
    };

    // Hide mobile navigation when login flow is started
    $scope.app.showNav = false;

    $scope.doLogin = function () {
        $log.debug('LoginFormCtrl.doLogin()');

        ngDialog.open({
            template: '/views/modals/register.html',
            scope: $scope
        });
    };

}]);
