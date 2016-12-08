'use strict';

angular
    .module('citizenos')
    .controller('MyGroupsCtrl', ['$rootScope', '$scope', '$state', '$stateParams', '$log', 'Group', function ($rootScope, $scope, $state, $stateParams, $log, Group) {
        $log.debug('MyGroupsCtrl');

        $scope.groupList = [];
        $scope.isGroupListLoading = true;

        Group
            .query().$promise
            .then(function (groups) {
                $scope.groupList = groups;
                $scope.isGroupListLoading = false;
                initGroupListView();
            }, function () {
                $log.log('MyGroupsCtrl', 'Group list fetch failed', res);
                $scope.isGroupListLoading = false;
            });

        var initGroupListView = function () {
            // Do not auto-navigate to first groups detail view in mobile
            if ($rootScope.wWidth > 750) { // TODO: When dev ends, define constants for different screen widths!
                if ($scope.groupList.length && !$stateParams.groupId) {
                    $state.go('mygroups.view', {groupId: $scope.groupList[0].id});
                }
            }
        };

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

        // In case there is $state.go('mygroups') somewhere, we need to initialize the view so that for non-mobile we show first Groups detail view.
        $scope.$on('$stateChangeSuccess', function () {
            if ($state.is('mygroups')) {
                initGroupListView();
            }
        });

    }]);
