'use strict';

angular
    .module('citizenos')
    .controller('GroupCtrl', ['$scope', '$state', '$stateParams', '$log', 'ngDialog', 'sAuth', 'GroupMemberUser', 'GroupMemberTopic', 'rGroup', function ($scope, $state, $stateParams, $log, ngDialog, sAuth, GroupMemberUser, GroupMemberTopic, rGroup) {
        $log.debug('GroupCtrl');

        $scope.group = rGroup;

        $scope.generalInfo = {
            isVisible: true
        };

        $scope.topicList = {
            isVisible: false,
            isSearchVisible: false,
            searchFilter: '',
            searchOrderBy: {
                property: 'title'
            }
        };

        $scope.userList = {
            isVisible: false,
            isSearchVisible: false,
            searchFilter: '',
            searchOrderBy: {
                property: 'name'
            }
        };

        $scope.doDeleteGroup = function () {
            ngDialog
                .openConfirm({
                    template: '/views/modals/group_delete_confirm.html'
                })
                .then(function () {
                    $scope.group
                        .$delete()
                        .then(function () {
                            $state.go('my.groups', null, {reload: true});
                        });
                }, angular.noop);
        };

        $scope.GroupMemberTopic = GroupMemberTopic;

        $scope.doShowMemberTopicList = function () {
            if (!$scope.topicList.isVisible) {
                GroupMemberTopic
                    .query({groupId: $scope.group.id}).$promise
                    .then(function (topics) {
                        $scope.group.members.topics.rows = topics;
                        $scope.group.members.topics.count = topics.length;
                        $scope.topicList.isVisible = true;
                        $scope.app.scrollToAnchor('topic_list');
                    });
            } else {
                $scope.app.scrollToAnchor('topic_list');
            }
        };

        $scope.doToggleMemberTopicList = function () {
            if ($scope.topicList.isVisible) {
                $scope.topicList.isVisible = false;
            } else {
                $scope.doShowMemberTopicList($scope.group);
            }
        };

        $scope.doUpdateMemberTopic = function (groupMemberTopic, level) {
            $log.debug('groupMemberTopic', groupMemberTopic, level);
            if (groupMemberTopic.permission.levelGroup !== level) {
                var oldLevel = groupMemberTopic.permission.levelGroup;
                groupMemberTopic.permission.levelGroup = level;
                groupMemberTopic
                    .$update({groupId: $scope.group.id})
                    .then(
                        angular.noop,
                        function () {
                            groupMemberTopic.permission.levelGroup = oldLevel;
                        });
            }
        };

        $scope.doDeleteMemberTopic = function (groupMemberTopic) {
            ngDialog
                .openConfirm({
                    template: '/views/modals/group_member_topic_delete_confirm.html',
                    data: {
                        topic: groupMemberTopic
                    }
                })
                .then(function () {
                    var index = $scope.group.members.topics.rows.indexOf(groupMemberTopic);
                    groupMemberTopic
                        .$delete({groupId: $scope.group.id})
                        .then(function () {
                            $scope.group.members.topics.rows.splice(index, 1);
                            $scope.group.members.topics.count = $scope.group.members.topics.rows.length;
                        });
                }, angular.noop);
        };

        $scope.GroupMemberUser = GroupMemberUser;

        $scope.doShowMemberUserList = function () {
            if (!$scope.userList.isVisible) {
                GroupMemberUser
                    .query({groupId: $scope.group.id}).$promise
                    .then(function (users) {
                        $scope.group.members.users.rows = users;
                        $scope.group.members.users.count = users.length;
                        $scope.userList.isVisible = true;
                        $scope.app.scrollToAnchor('user_list');
                    });
            } else {
                $scope.app.scrollToAnchor('user_list');
            }
        };

        $scope.doToggleMemberUserList = function () {
            if ($scope.userList.isVisible) {
                $scope.userList.isVisible = false;
            } else {
                $scope.doShowMemberUserList();
            }
        };

        $scope.doUpdateMemberUser = function (groupMemberUser, level) {
            if (groupMemberUser.level !== level) {
                var oldLevel = groupMemberUser.level;
                groupMemberUser.level = level;
                groupMemberUser
                    .$update({groupId: $scope.group.id})
                    .then(
                        angular.noop,
                        function () {
                            groupMemberUser.level = oldLevel;
                        });
            }
        };

        $scope.doDeleteMemberUser = function (groupMemberUser) {
            ngDialog
                .openConfirm({
                    template: '/views/modals/group_member_user_delete_confirm.html',
                    data: {
                        user: groupMemberUser
                    }
                })
                .then(function () {
                    groupMemberUser
                        .$delete({groupId: $scope.group.id})
                        .then(function () {
                            $scope.group.members.users.rows.splice($scope.group.members.users.rows.indexOf(groupMemberUser), 1);
                            $scope.group.members.users.count = $scope.group.members.users.rows.length;
                        });
                }, angular.noop);
        };

        $scope.doLeaveGroup = function () {
            ngDialog
                .openConfirm({
                    template: '/views/modals/group_member_user_leave_confirm.html',
                    data: {
                        group: $scope.group
                    }
                })
                .then(function () {
                    var groupMemberUser = new GroupMemberUser({id: sAuth.user.id});
                    groupMemberUser
                        .$delete({groupId: $scope.group.id})
                        .then(function () {
                            $state.go('my.groups', null, {reload: true});
                        });
                });
        };

    }]);
