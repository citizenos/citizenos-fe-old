'use strict';

angular
    .module('citizenos')
    .controller('AppCtrl', ['$scope', '$log', 'cosConfig', 'ngDialog', function ($scope, $log, cosConfig, ngDialog) {
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
