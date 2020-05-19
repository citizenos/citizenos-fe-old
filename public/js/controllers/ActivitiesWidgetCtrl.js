'use strict';

angular
    .module('citizenos')
    .controller('ActivitiesWidgetCtrl', ['$scope', '$stateParams', '$log', '$translate', 'sActivity', 'ActivitiesResolve', function ($scope, $stateParams, $log, $translate, sActivity, ActivitiesResolve) {
        $log.debug('ActivitiesWidgetCtrl');

        $scope.activities = ActivitiesResolve;
        console.log($scope.activities);
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

        $scope.keyCounter = function (objIn) {
            return Object.keys(objIn).length;
        };

        $scope.getGroupItems = function (values) {
            var returnArray = [];
            Object.keys(values).forEach(function (key) {
                returnArray.push(values[key]);
            });

            return returnArray;
        };

        $scope.translateGroup = function (key, group) {
            var values = group[0].values;
            values.groupCount = group.length;

            return $translate.instant(key.split(':')[0], values);
        };
    }]);
