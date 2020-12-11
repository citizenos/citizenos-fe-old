'use strict';

angular
    .module('citizenos')
    .controller('HelpFormCtrl', ['$scope', '$http', '$stateParams', '$window' , function ($scope, $http, $stateParams, $window) {
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
                description: $scope.form.description
            };

            console.log('PARAMS', mailParams);
/*
            return $http.post(path, mailParams).then(function () {
                init();
            }, function () {
                console.log('WeNT WRONG')
            });*/
        };
    }]);
