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
                var userActivityGroups = {};
                var activityGroups = {};
                var returnActivities = [];

                for(var i=0; i < activities.length; i++) {
                    var id = activities[i].data.object.id;
                    if (activities[i].data.target) {
                        id = activities[i].data.target.id;
                    }

                    var groupKey = activities[i].string + '_' + id;
                    var userGroupKey = groupKey + '_' + activities[i].data.actor.id;
                    //Create group with id-s
                    if (!activityGroups[groupKey]) {
                        activityGroups[groupKey] = new Array(activities[i]);
                    } else {
                        activityGroups[groupKey].push(activities[i]);
                    }
                    //Create group with same actor
                    if (!userActivityGroups[userGroupKey]) {
                        userActivityGroups[userGroupKey] = new Array(activities[i]);
                    } else {
                        userActivityGroups[userGroupKey].push(activities[i]);
                    }

                }

                userActivityGroups = _.filter(userActivityGroups, function (item) {return item.length > 1;});
                var userGroupIds = [];
                Object.keys(userActivityGroups).forEach(function (key) {
                    var groupItems = _.map(userActivityGroups[key], function(item) {return item.id});
                    userGroupIds.push(groupItems);
                });

                userGroupIds = _.flatten(userGroupIds, function (item) {return item.length > 1;});

                var groupIds = [];
                Object.keys(activityGroups).forEach(function (key) {
                    var groupItems = _.map(activityGroups[key], function(item) {return item.id});
                    groupIds.push(_.filter(groupItems, function (item) { return userGroupIds.indexOf(item) === -1;}));
                    groupIds = _.filter(groupIds, function (item) {return item.length > 1});
                });
                var groupIdsFlat = _.flatten(groupIds);
                userActivityGroups.forEach(function (items) {
                    items.forEach(function (item) {
                        item.string = item.string + '_USERACTIVITYGROUP';
                        item.values.groupCount = items.length;
                    });
                    _.sortBy(items, ['createdAt']).reverse();
                });

                var finalGroups = _.map(groupIds, function (group) {
                    var itemGroup = _.map(group, function (itemId) {
                        return _.find(activities, function (activity) {
                            return activity.id === itemId;
                        })
                    });

                    itemGroup.forEach(function (value) {
                        value.string = value.string + '_ACTIVITYGROUP';
                        value.values.groupCount = (itemGroup.length -1);
                    });

                    return _.sortBy(itemGroup, ['updatedAt']).reverse();
                });

                activities.forEach(function (activity, index) {
                    if (groupIdsFlat.indexOf(activity.id) === -1 && userGroupIds.indexOf(activity.id) === -1) {
                        finalActivities[index] = [activity];
                    } else {
                        if (userActivityGroups.length) {
                            userActivityGroups.forEach(function (group) {
                                var found = _.find(group, function (groupActivity) {
                                    return groupActivity.id === activity.id;
                                });

                                if (found) {
                                    finalActivities[activity.string] = group;
                                }
                            });
                        }
                        if (finalGroups.length) {
                            finalGroups.forEach(function (group) {
                                var found = _.find(group, function (groupActivity) {
                                    return groupActivity.id === activity.id;
                                });

                                if (found) {
                                    finalActivities[activity.string] = group;
                                }
                            });
                        }

                    }
                });

                Object.keys(finalActivities).forEach(function (item) {

                    var groupItems = {};
                    var i = 0;
                    finalActivities[item].forEach(function (value){
                        groupItems[i] = value;
                        i++;
                    });

                    returnActivities.push({referer: item, values: groupItems});
                });

                return _.sortBy(returnActivities, [function(o) { return o.values[0].updatedAt; }]).reverse();
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
