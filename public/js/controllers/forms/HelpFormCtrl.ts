'use strict';
import * as angular from 'angular';

angular
    .module('citizenos')
    .controller('HelpFormCtrl', ['$scope', '$http', '$location', 'sLocation', '$window', '$cookies', 'sNotification', 'cosConfig' , function ($scope, $http, $location, sLocation, $window, $cookies, sNotification, cosConfig) {
        var init = function () {
            $scope.errors = null;
            $scope.form = {
                email: null,
                description: null,
                clientData: false
            };
            $scope.isLoading = false;
        };

        init();

        $scope.closeTootlip = function() {
            $scope.app.helptooltip = false;
            $scope.app.helpBubbleAnimate();
        }

        $scope.sendHelp = function () {
            $scope.isLoading = true;

            var mailParams = {
                email: $scope.form.email,
                description: $scope.form.description,
                userAgent: $window.clientInformation.userAgent,
                platform: $window.clientInformation.platform,
                height: $window.innerHeight,
                width: $window.innerWidth,
                location: $location.url()
            };

            var path = sLocation.getAbsoluteUrlApi('/api/internal/help');

            return $http.post(path, mailParams)
                .then(
                    function () {
                        sNotification.addSuccess('HELP_WIDGET.MSG_REQUEST_SENT');
                        init();
                    },
                    function () {
                        $scope.isLoading = false;
                    });
        };

        $scope.helpback = function () {
            const helpFrame = document.getElementById("help_frame") as HTMLIFrameElement | null;
            helpFrame.src = helpFrame.src;
        }
    }]);
