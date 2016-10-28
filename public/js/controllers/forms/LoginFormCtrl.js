'use strict';

angular
    .module('citizenos')
    .controller('LoginFormCtrl', ['$scope', '$log', 'ngDialog', 'sAuth', function ($scope, $log, ngDialog, sAuth) {
        $log.debug('LoginFormCtrl', ngDialog);

        $scope.form = {
            email: null,
            password: null
        };

        // Hide mobile navigation when login flow is started
        $scope.app.showNav = false;

        $scope.doLogin = function () {
            $log.debug('LoginFormCtrl.doLogin()');
            sAuth.login($scope.form.email, $scope.form.password)
                .then(function (res) {
                    console.log(res);
                } )
            ngDialog.open({
                template: '/views/modals/register.html',
                scope: $scope
            });
        };
    }]);
