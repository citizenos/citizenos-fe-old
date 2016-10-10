'use strict';

app.controller('AppCtrl', ['$scope', '$log', 'cosConfig', function ($scope, $log, cosConfig) {
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

}]);
