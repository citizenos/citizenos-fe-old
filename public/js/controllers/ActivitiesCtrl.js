'use strict';

angular
    .module('citizenos')
    .controller('ActivitiesCtrl', ['$scope', '$stateParams', '$document', 'sActivity', function ($scope, $stateParams, $document, sActivity) {
        $scope.activitiesOffset = 0;
        $scope.activitiesLimit = 25;
        $scope.activities = [];
        $scope.filter = 'all';
        $scope.activityfilters = ['all', 'userTopics', 'userGroups', 'user', 'self'];
        var lastViewTime = null;

        $scope.loadActivities = function (offset, limit) {
            $scope.activitiesOffset = offset || $scope.activitiesOffset;
            if (offset === 0) {
                $scope.activitiesOffset = 0;
            }

            $scope.activitiesLimit = limit || $scope.activitiesLimit;
            if ($scope.activities.length && !offset && !limit) {
                $scope.activitiesOffset += $scope.activitiesLimit;
            }

            var filterValue = $scope.filter;
            if (filterValue === 'all') {
                filterValue = null;
            }

            var activitiesToGroups = function (activities) {
                var finalActivities = {};
                var returnActivities = [];

                for(var i=0; i < activities.length; i++) {
                    var id = activities[i].data.object.id;
                    if (activities[i].data.target) {
                        id = activities[i].data.target.id;
                    }
                    var key = activities[i].string + '_' + id;
                    if (!finalActivities[key]) {
                        finalActivities[key] = new Array(activities[i]);
                    } else {
                        finalActivities[key].push(_.cloneDeep(activities[i]));
                    }
                }

                Object.keys(finalActivities).forEach(function (item) {

                    var groupItems = {};
                    finalActivities[item].forEach(function (value){
                        groupItems[value.id] = value;
                    });

                    returnActivities.push({referer: item, values: groupItems});
                });

                return returnActivities;
            };

            $scope.keyCounter = function (objIn) {
                console.log(objIn);
                return Object.keys(objIn).length;
            };

            $scope.getGroupItems = function (values) {
                var returnArray = [];
                Object.keys(values).forEach(function (key) {
                    returnArray.push(values[key]);
                });

                console.log(returnArray.length)
                return returnArray;
            };

            sActivity
                .getActivities($scope.activitiesOffset, $scope.activitiesLimit, filterValue)
                .then(function (activities) {
                    $scope.app.unreadActivitiesCount = 0;
                    activities.forEach(function (activity, key) {
                        if (activity.data.type === 'View' && activity.data.object && activity.data.object['@type'] === 'Activity') {
                            if (!lastViewTime || activity.updatedAt > lastViewTime) {
                                lastViewTime = activity.updatedAt;
                            }
                            activities.splice(key, 1);
                        } else if (!lastViewTime || activity.updatedAt > lastViewTime) {
                            activity.isNew = '-new';
                        }
                    });
                    var groupedActivities = activitiesToGroups(activities);
                    $scope.showLoadMoreActivities = (!groupedActivities.length < $scope.activitiesLimit);
                    $scope.activities = $scope.activities.concat(groupedActivities);

                    var element = angular.element($document[0].getElementsByClassName('lightbox_content'));
                    if (element && element[0] && element[0].scrollHeight) {
                       /* $scope.$watch(element[0].scrollHeight, function () {
                            if (activities.length && element[0].clientHeight >= element[0].scrollHeight) {
                               // $scope.loadActivities();
                            }
                        }, true);*/
                    }

                });
        };
        $scope.loadActivities();

        $scope.filterActivities = function (filter) {
            $scope.filter = filter;
            $scope.activities = [];
            $scope.loadActivities(0);
        };

        $scope.showActivityDescription = function (activity) {
            return sActivity.showActivityDescription(activity);
        };

        $scope.showActivityUpdateVersions = function (activity) {
            return sActivity.showActivityUpdateVersions(activity);
        };

        $scope.activityRedirect = function (activity) {
            return sActivity.handleActivityRedirect(activity);
        };
    }
    ]);
