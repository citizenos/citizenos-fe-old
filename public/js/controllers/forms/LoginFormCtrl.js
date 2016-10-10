'use strict';

app.controller('LoginFormCtrl', ['$scope', '$log', 'ngDialog', function ($scope, $log, ngDialog) {
    $log.debug('LoginFormCtrl');

    $scope.form = {
        email: null,
        password: null
    };

    $scope.doLogin = function () {
        $log.debug('LoginFormCtrl.doLogin()');
        ngDialog.closeAll();
        ngDialog.open({
           template: '/views/modals/register.html'
        });
    };

}]);
