'use strict';

angular
    .module('citizenos')
    .controller('ActivitiesCtrl', [
        '$scope', '$stateParams', 'sActivity', function ($scope, $stateParams, sActivity) {
        $scope.activitiesOffset = 0;
        $scope.activitiesLimit = 10;
        $scope.activities = [];

        $scope.loadActivities = function (offset, limit) {
            console.log('LOADACTIVITIES');
            $scope.activitiesOffset = offset || $scope.activitiesOffset;
            $scope.activitiesLimit = limit || $scope.activitiesLimit;
            if ($scope.activities.length && !offset && !limit) {
                $scope.activitiesOffset += $scope.activitiesLimit;
            }

            sActivity
                .getActivities($scope.activitiesOffset, $scope.activitiesLimit)
                .then(function (activities) {
                    $scope.showLoadMoreActivities = !(activities.length < $scope.activitiesLimit);
                    $scope.activities = $scope.activities.concat(activities);
                });
        };
        $scope.loadActivities();
    }
]);
