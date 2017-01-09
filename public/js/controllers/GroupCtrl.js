'use strict';

angular
    .module('citizenos')
    .controller('GroupCtrl', ['$scope', '$state', '$stateParams', '$log', 'ngDialog', 'sTranslate', 'sAuth', 'GroupMemberUser', 'GroupMemberTopic', function ($scope, $state, $stateParams, $log, ngDialog, sTranslate, sAuth, GroupMemberUser, GroupMemberTopic) {
        $log.debug('GroupCtrl');

        $scope.group = _.find($scope.itemList, {id: $stateParams.groupId});

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

        $scope.doDeleteGroup = function (group) {
            $log.debug('doDeleteGroup', group, $scope.itemList.indexOf(group));

            ngDialog
                .openConfirm({
                    template: '/views/modals/group_delete_confirm.html'
                })
                .then(function () {
                    group
                        .$delete()
                        .then(function () {
                            $state.go('my.groups', null, {reload: true});
                        });
                }, angular.noop);
        };

        $scope.GroupMemberTopic = GroupMemberTopic;

        $scope.doShowMemberTopicList = function (group) {
            if (!$scope.topicList.isVisible) {
                GroupMemberTopic
                    .query({groupId: group.id}).$promise
                    .then(function (topics) {
                        group.topics.rows = topics;
                        group.topics.count = topics.length;
                        $scope.topicList.isVisible = true;
                        $scope.app.scrollToAnchor('topic_list');
                    });
            } else {
                $scope.app.scrollToAnchor('topic_list');
            }
        };

        $scope.doToggleMemberTopicList = function (group) {
            if ($scope.topicList.isVisible) {
                $scope.topicList.isVisible = false;
            } else {
                $scope.doShowMemberTopicList(group);
            }
        };

        $scope.doUpdateMemberTopic = function (group, groupMemberTopic, level) {
            $log.debug('groupMemberTopic', groupMemberTopic, level);
            if (groupMemberTopic.permission.levelGroup !== level) {
                var oldLevel = groupMemberTopic.permission.levelGroup;
                groupMemberTopic.permission.levelGroup = level;
                groupMemberTopic
                    .$update({groupId: group.id})
                    .then(
                        angular.noop,
                        function () {
                            groupMemberTopic.permission.levelGroup = oldLevel;
                        });
            }
        };

        $scope.doDeleteMemberTopic = function (group, groupMemberTopic) {
            ngDialog
                .openConfirm({
                    template: '/views/modals/group_member_topic_delete_confirm.html',
                    data: {
                        topic: groupMemberTopic
                    }
                })
                .then(function () {
                    var index = group.topics.rows.indexOf(groupMemberTopic);
                    groupMemberTopic
                        .$delete({groupId: group.id})
                        .then(function () {
                            group.topics.rows.splice(index, 1);
                            group.topics.count = group.topics.rows.length;
                        });
                }, angular.noop);
        };

        $scope.GroupMemberUser = GroupMemberUser;

        $scope.doShowMemberUserList = function (group) {
            if (!$scope.userList.isVisible) {
                GroupMemberUser
                    .query({groupId: group.id}).$promise
                    .then(function (users) {
                        group.members.rows = users;
                        group.members.count = users.length;
                        $scope.userList.isVisible = true;
                        $scope.app.scrollToAnchor('user_list');
                    });
            } else {
                $scope.app.scrollToAnchor('user_list');
            }
        };

        $scope.doToggleMemberUserList = function (group) {
            if ($scope.userList.isVisible) {
                $scope.userList.isVisible = false;
            } else {
                $scope.doShowMemberUserList(group);
            }
        };

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
            ngDialog
                .openConfirm({
                    template: '/views/modals/group_member_user_delete_confirm.html',
                    data: {
                        user: groupMemberUser
                    }
                })
                .then(function () {
                    groupMemberUser
                        .$delete({groupId: group.id})
                        .then(function () {
                            group.members.rows.splice(group.members.rows.indexOf(groupMemberUser), 1);
                            group.members.count = group.members.rows.length;
                        }, function (res) {
                            $scope.app.doShowNotification($scope.app.notifications.levels.ERROR, res.data.status.message);
                        });
                }, angular.noop);
        };

        $scope.doLeaveGroup = function (group) {
            ngDialog
                .openConfirm({
                    template: '/views/modals/group_member_user_leave_confirm.html',
                    data: {
                        group: group
                    }
                })
                .then(function () {
                    var groupMemberUser = new GroupMemberUser({id: sAuth.user.id});
                    groupMemberUser
                        .$delete({groupId: group.id})
                        .then(function () {
                            $state.go('my.groups', null, {reload: true});
                        }, function (res) {
                            // FIXME: More generic handling
                            if (res.data.status.code === 40000) {
                                $scope.app.doShowNotification($scope.app.notifications.levels.ERROR, 'You cannot leave this Group as you are the last admin user of this Group. Please assign a new admin to leave.');
                            }
                        });
                });
        };

    }]);
