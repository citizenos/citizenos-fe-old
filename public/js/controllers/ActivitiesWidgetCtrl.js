'use strict';

angular
    .module('citizenos')
    .controller('ActivitiesWidgetCtrl', [
        '$scope', '$stateParams', 'sActivity', function ($scope, $stateParams, sActivity) {
            $scope.activities = [];

            var offsetDefault = 0;
            var limitDefault = 25;

            $scope.loadActivities = function (offset, limit) {
                offset = offset || offsetDefault;
                limit = limit || limitDefault;

                sActivity
                    .getActivitiesUnauth(offset, limit)
                    .then(function(activities){
                        $scope.activities = activities;
                    });
            };
            $scope.loadActivities();

            $scope.showActivityDescription = function (activity) {
                return sActivity.showActivityDescription(activity);
            };

            $scope.showActivityUpdateVersions = function (activity) {
                return sActivity.showActivityUpdateVersions(activity);
            };

            $scope.loadActivities();
        }
    ]);
