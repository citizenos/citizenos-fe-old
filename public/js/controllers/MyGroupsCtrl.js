'use strict';

angular
    .module('citizenos')
    .controller('MyGroupsCtrl', ['$rootScope', '$scope', '$state', '$log', 'sGroup', 'sTopic', function ($rootScope, $scope, $state, $log, sGroup, sTopic) {
        $log.debug('MyGroupsCtrl');

        $scope.groupList = [];
        $scope.isGroupListLoading = true;

        sGroup
            .list()
            .then(function (res) {
                $scope.groupList = res.data.data.rows;
                $scope.isGroupListLoading = false;

                // Do not auto-navigate to first groups detail view in mobile
                if ($rootScope.wWidth > 750) { // TODO: When dev ends, define constants for different screen widths!
                    if ($scope.groupList.length) {
                        $state.go('mygroups.groupId', {groupId: $scope.groupList[0].id});
                    }
                }
            }, function (res) {
                $log.log('MyGroupsCtrl', 'Group list fetch failed', res);
                $scope.isGroupListLoading = false;
            });

        $scope.doShowGroupTopicList = function (groupId) {
            $log.debug('MyGroupsCtrl.doShowGroupTopicList', groupId);
            var group = _.find($scope.groupList, {id: groupId});
            if (!group.topics.rows) {
                sGroup
                    .topicsList(groupId)
                    .then(function (res) {
                        group.topics.rows = res.data.data.rows;
                        group.topics.count = res.data.data.count;
                    }, function (res) {
                        $log.log('MyGroupsCtrl', 'Group topic list fetch failed', res);
                    });
            }
        };

        $scope.isTopicPrivate = function (topic) {
            $log.debug('MyGroupsCtrl.isTopicPrivate', topic.id, topic.visibility === sTopic.VISIBILITY.private);
            return topic.visibility === sTopic.VISIBILITY.private;
        };

    }]);
