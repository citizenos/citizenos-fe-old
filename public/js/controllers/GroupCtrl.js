'use strict';

angular
    .module('citizenos')
    .controller('GroupCtrl', ['$scope', '$state', '$stateParams', '$anchorScroll', '$log', 'sTranslate', 'GroupMemberUser', 'GroupMemberTopic', function ($scope, $state, $stateParams, $anchorScroll, $log, sTranslate, GroupMemberUser, GroupMemberTopic) {
        $log.debug('GroupCtrl');

        $scope.group = _.find($scope.groupList, {id: $stateParams.groupId});

        $scope.isTopicListVisible = false;
        $scope.isTopicListSearchVisible = false;

        $scope.isUserListVisible = false;
        $scope.isUserListSearchVisible = false;

        $scope.doDeleteGroup = function (group) {
            $log.debug('doDeleteGroup', group, $scope.groupList.indexOf(group));
            var index = $scope.groupList.indexOf(group);
            group
                .$delete()
                .then(function () {
                    $scope.groupList.splice(index, 1);
                    $state.go('mygroups');
                });
        };

        $scope.doToggleTopicList = function (group) {
            if ($scope.isTopicListVisible) {
                $scope.isTopicListVisible = false;
                return;
            }

            GroupMemberTopic
                .query({groupId: group.id}).$promise
                .then(function (topics) {
                    group.topics.rows = topics;
                    group.topics.count = topics.length;
                    $scope.isTopicListVisible = true;
                });
        };

        $scope.doDeleteMemberTopic = function (group, groupMemberTopic) {
            var index = group.topics.rows.indexOf(groupMemberTopic);
            groupMemberTopic
                .$delete({groupId: group.id})
                .then(function () {
                    group.topics.rows.splice(index, 1);
                    group.topics.count = group.topics.rows.length;
                });
        };

        $scope.doToggleUserList = function (group) {
            if ($scope.isUserListVisible) {
                $scope.isUserListVisible = false;
                return;
            }

            GroupMemberUser
                .query({groupId: group.id}).$promise
                .then(function (users) {
                    group.members.rows = users;
                    group.members.count = users.length;
                    $scope.isUserListVisible = true;
                });
        };

        $scope.GroupMemberUser = GroupMemberUser;

        $scope.doUpdateMemberUser = function (group, groupMemberUser, level) {
            if (groupMemberUser.level !== level) {
                var oldLevel = groupMemberUser.level;
                groupMemberUser.level = level;
                groupMemberUser
                    .$update({groupId: group.id})
                    .then(
                        angular.noop,
                        function () {
                            groupMemberUser.level = oldLevel;
                        });
            }
        };

        $scope.doDeleteMemberUser = function (group, groupMemberUser) {
            var index = group.members.rows.indexOf(groupMemberUser);
            groupMemberUser
                .$delete({groupId: group.id})
                .then(function () {
                    group.members.rows.splice(index, 1);
                    group.members.count = group.members.rows.length;
                });
        };

    }]);
