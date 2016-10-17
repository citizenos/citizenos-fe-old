'use strict';

app.controller('AppCtrl', ['$scope', '$log', '$location', 'cosConfig', function ($scope, $log, $location, cosConfig) {
    $log.debug('AppCtrl');
    console.log($location.$$html5);
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
