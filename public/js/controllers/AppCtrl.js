'use strict';

app.controller('AppCtrl', ['$scope', '$state', '$rootScope','$log', '$location', 'cosConfig', 'ngDialog', 'LocaleService','sAuth', function ($scope, $state, $rootScope, $log, $location, cosConfig, ngDialog, LocaleService, sAuth) {
    $log.debug('AppCtrl');

    $scope.app = {
        config: cosConfig,
        showSearch: false,
        showSearchResults: false,
        showNav: false
    };

    $scope.app.user = sAuth.user;

    sAuth.status();
    $scope.doShowLogin = function () {
        $log.debug('AppCtrl.doShowLogin()');

        ngDialog.open({
            template: '/views/modals/login.html',
            scope: $scope
        });
    };

    $scope.app.logout = function () {
        $state.go('home');
        sAuth.logout();
    };
    $scope.app.alert = function (str) {
        alert(str);
    };

}]);
