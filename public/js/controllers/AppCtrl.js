'use strict';

app.controller('AppCtrl', ['$scope', '$log', 'cosConfig', 'ngDialog', function ($scope, $log, cosConfig, ngDialog) {
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
        ngDialog.open({
            template: '/views/modals/login.html',
            scope: $scope
        });
    };
}]);
