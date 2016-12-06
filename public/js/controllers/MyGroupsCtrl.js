'use strict';

angular
    .module('citizenos')
    .controller('MyGroupsCtrl', ['$rootScope', '$scope', '$state', '$log', 'Group', function ($rootScope, $scope, $state, $log, Group) {
        $log.debug('MyGroupsCtrl');

        $scope.groupList = [];
        $scope.isGroupListLoading = true;

        Group
            .query().$promise
            .then(function (groups) {
                $scope.groupList = groups;
                $scope.isGroupListLoading = false;

                // Do not auto-navigate to first groups detail view in mobile
                if ($rootScope.wWidth > 750) { // TODO: When dev ends, define constants for different screen widths!
                    if ($scope.groupList.length) {
                        $state.go('mygroups.groupId', {groupId: $scope.groupList[0].id});
                    }
                }
            }, function () {
                $log.log('MyGroupsCtrl', 'Group list fetch failed', res);
                $scope.isGroupListLoading = false;
            });

        $scope.doToggleGroupTopicList = function (group) {
            if (group.isTopicListExpanded) {
                group.isTopicListExpanded = false;
            } else {
                if (!group.topics.rows) {
                    group
                        .getTopicList().$promise
                        .then(function () {
                            group.isTopicListExpanded = true;
                        });
                } else {
                    group.isTopicListExpanded = true;
                }
            }
        };

    }]);
