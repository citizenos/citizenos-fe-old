'use strict';

angular
    .module('citizenos')
    .controller('HelpFormCtrl', ['$scope', '$http', '$location', 'sLocation', '$window', 'sNotification' , function ($scope, $http, $location, sLocation, $window, sNotification) {
        var init = function () {
            $scope.errors = null;
            $scope.form = {
                email: null,
                description: null
            };
            $scope.showHelp = false; // Hide mobile navigation when login flow is started
        };
        init();
        $scope.sendHelp = function () {

            var mailParams = {
                userAgent: $window.clientInformation.userAgent,
                platform: $window.clientInformation.platform,
                height: $window.innerHeight,
                width: $window.innerWidth,
                email: $scope.form.email,
                description: $scope.form.description,
                location: $location.url()
            };

            var path = sLocation.getAbsoluteUrlApi('/api/internal/help');

            return $http.post(path, mailParams).then(function () {
                sNotification.addSuccess('HELP_WIDGET.MSG_REQUEST_SENT');
                init();
            }, function () {
            });
        };
    }]);
