'use strict';

angular
    .module('citizenos')
    .controller('TestCtrl', ['$scope', '$log', 'sTopic', function ($scope, $log, sTopic) {
        $scope.item  = 10;
        $scope.date  = new Date();
        $scope.saveItem = function () {
            console.log('saveItem');
            console.log($scope.item);
        };

        $scope.saveDate = function () {
            console.log('saveDate');
            console.log($scope.date);
        };

    }]);
