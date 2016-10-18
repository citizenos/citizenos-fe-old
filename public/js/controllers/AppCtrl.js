'use strict';

app.controller('AppCtrl', ['$scope', '$log', '$location', 'cosConfig', 'ngDialog', 'LocaleService', function ($scope, $log, $location, cosConfig, ngDialog, LocaleService) {
    $log.debug('AppCtrl');
    $scope.app = {
        config: cosConfig,
        showSearch: false,
        showSearchResults: false,
        showNav: false
    };

    $scope.app.user = {
        loggedIn: false
    };

    $scope.doShowLogin = function () {
        $log.debug('AppCtrl.doShowLogin()');

        ngDialog.open({
            template: '/views/modals/login.html',
            scope: $scope
        });
    };

    $scope.app.alert = function (str) {
        alert(str);
    };
}]);
