'use strict';

angular
    .module('citizenos')
    .controller('ActivitiesWidgetCtrl', ['$scope', '$stateParams', '$log', 'sActivity', 'ActivitiesResolve', function ($scope, $stateParams, $log, sActivity, ActivitiesResolve) {
        $log.debug('ActivitiesWidgetCtrl');

        $scope.activities = ActivitiesResolve;

        $scope.showActivityDescription = function (activity) {
            return sActivity.showActivityDescription(activity);
        };

        $scope.showActivityUpdateVersions = function (activity) {
            return sActivity.showActivityUpdateVersions(activity);
        };

        $scope.onClick = function (activity) {
            var topic;

            var activityData = activity.data;
            var activityTarget = activityData.target;
            var activityObject = activityData.object;


            if (activityTarget && activityTarget['@type'] === 'Topic') {
                topic = activityTarget;
            } else if (activityObject && activityObject['@type'] === 'Topic') {
                topic = activityObject;
            }

            if (topic) {
                $scope.widgetPostMessage({
                    click: {
                        topic: topic
                    }
                });
            }
        };
    }]);
