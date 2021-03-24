'use strict';

angular
    .module('citizenos')
    .controller('HelpFormCtrl', ['$scope', '$http', '$location', 'sLocation', '$window', 'sNotification', function ($scope, $http, $location, sLocation, $window, sNotification) {
        var init = function () {
            $scope.errors = null;
            $scope.form = {
                email: null,
                description: null,
                clientData: false
            };
            $scope.showHelp = false; // Hide mobile navigation when login flow is started
        };

        init();

        $scope.sendHelp = function () {
            var mailParams = {
                email: $scope.form.email,
                description: $scope.form.description
            };

            mailParams.userAgent = $window.clientInformation.userAgent;
            mailParams.platform = $window.clientInformation.platform;
            mailParams.height = $window.innerHeight;
            mailParams.width = $window.innerWidth;
            mailParams.location = $location.url();

            var path = sLocation.getAbsoluteUrlApi('/api/internal/help');

            return $http.post(path, mailParams)
                .then(
                    function () {
                        sNotification.addSuccess('HELP_WIDGET.MSG_REQUEST_SENT');
                        init();
                    },
                    function () {
                    });
        };

    }]);
