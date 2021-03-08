'use strict';

angular
    .module('citizenos')
    .controller('GroupCtrl', ['$rootScope', '$scope', '$state', '$stateParams', '$log', '$location', 'ngDialog', 'sAuth', 'GroupMemberUser', 'GroupMemberTopic', 'rGroup', function ($rootScope, $scope, $state, $stateParams, $log, $location, ngDialog, sAuth, GroupMemberUser, GroupMemberTopic, rGroup) {
        $log.debug('GroupCtrl');

        var ITEMS_COUNT_PER_PAGE = 10;
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

        $scope.loadMemberTopicsList = function (offset, limit) {
            if (!limit) {
                limit = ITEMS_COUNT_PER_PAGE;
            }
            if (!offset) {
                offset = 0;
            }

            var search = null;
            if ($scope.topicList.searchFilter) {
                search = $scope.topicList.searchFilter.trim();
            }

            return GroupMemberTopic
                .query({
                    groupId: $scope.group.id,
                    limit: limit,
                    search: search,
                    offset: offset
                }).$promise
                .then(function (topics) {
                    $scope.group.members.topics.rows = topics;
                    $scope.group.members.topics.count = topics.length;

                    if (topics.length) {
                        $scope.group.members.topics.count = topics[0].countTotal;
                    }

                    $scope.group.members.topics.totalPages = Math.ceil($scope.group.members.topics.count / limit);
                    $scope.group.members.topics.page = Math.ceil((offset + limit) / limit);

                    return topics;
                });
        };

        $scope.loadMemberTopicsPage = function (page) {
            var offset = (page - 1) * ITEMS_COUNT_PER_PAGE;
            $scope.loadMemberTopicsList(offset, ITEMS_COUNT_PER_PAGE);
        };

        $scope.loadMemberUsersList = function (offset, limit) {
            if (!limit) {
                limit = ITEMS_COUNT_PER_PAGE;
            }
            if (!offset) {
                offset = 0;
            }

            var search = null;
            if ($scope.userList.searchFilter) {
                search = $scope.userList.searchFilter.trim();
            }

            return GroupMemberUser
                    .query({
                        groupId: $scope.group.id,
                        limit: limit,
                        search: search,
                        offset: offset
                    }).$promise
                    .then(function (users) {
                        $scope.group.members.users.rows = users;
                        $scope.group.members.users.count = users.length;

                        if (users.length) {
                            $scope.group.members.users.count = users[0].countTotal;
                        }

                        $scope.group.members.users.totalPages = Math.ceil($scope.group.members.users.count / limit);
                        $scope.group.members.users.page = Math.ceil((offset + limit) / limit);
                        return users;
                    });
        };

        $scope.loadMemberUsersPage = function (page) {
            var offset = (page - 1) * ITEMS_COUNT_PER_PAGE;
            $scope.loadMemberUsersList(offset, ITEMS_COUNT_PER_PAGE);
        };

        $scope.doShowMemberTopicList = function () {
            if (!$scope.topicList.isVisible) {
                $scope.loadMemberTopicsList()
                    .then(function () {
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
                    groupMemberTopic
                        .$delete({groupId: $scope.group.id})
                        .then(function () {
                            $scope.loadMemberTopicsList();
                        });
                }, angular.noop);
        };

        $scope.GroupMemberUser = GroupMemberUser;

        $scope.doShowMemberUserList = function () {
            if (!$scope.userList.isVisible) {
                $scope.loadMemberUsersList()
                    .then(function () {
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
                            $scope.loadMemberUsersList();
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

        if (sAuth.user.loggedIn) {
            $scope.loadMemberTopicsList();
            $scope.loadMemberUsersList();
        }
    }]);
