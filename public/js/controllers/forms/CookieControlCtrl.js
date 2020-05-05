'use strict';

angular
    .module('citizenos')
    .controller('CookieControlCtrl', ['$scope', '$log', '$cookies', 'ngDialog', 'cosConfig', function ($scope, $log, $cookies, ngDialog, cosConfig) {
        $scope.cookieControlSettings = {
            necessary: true,
            analytics: false
        };

        $scope.saveCookieSettings = function () {
            var expires = new Date();
            expires.setDate(expires.getDate() + cosConfig.legal.cookieControl.maxAgeDays);

            $cookies.putObject(
                cosConfig.legal.cookieControl.cookieName,
                $scope.cookieControlSettings,
                {
                    expires: expires
                }
            );

            if ($scope.cookieControlSettings.analytics) {
                $scope.app.loadAnalytics();
            }

            ngDialog.closeAll();
        };

    }]);
