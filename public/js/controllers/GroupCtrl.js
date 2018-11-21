'use strict';

angular
    .module('citizenos')
    .controller('GroupCtrl', ['$rootScope', '$scope', '$state', '$stateParams', '$log', '$location', 'ngDialog', 'sAuth', 'GroupMemberUser', 'GroupMemberTopic', 'rGroup', function ($rootScope, $scope, $state, $stateParams, $log, $location, ngDialog, sAuth, GroupMemberUser, GroupMemberTopic, rGroup) {
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

        var loadMemberTopicsList = function () {
            return GroupMemberTopic
                .query({groupId: $scope.group.id}).$promise
                .then(function (topics) {
                    $scope.group.members.topics.rows = topics;
                    $scope.group.members.topics.count = topics.length;

                    return topics;
                });
        };

        var loadMemberUsersList = function () {
            return GroupMemberUser
                    .query({groupId: $scope.group.id}).$promise
                    .then(function (users) {
                        $scope.group.members.users.rows = users;
                        $scope.group.members.users.count = users.length;

                        return users;
                    });
        };

        $scope.doShowMemberTopicList = function () {
            if (!$scope.topicList.isVisible) {
                loadMemberTopicsList()
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
                            loadMemberTopicsList();
                        });
                }, angular.noop);
        };

        $scope.GroupMemberUser = GroupMemberUser;

        $scope.doShowMemberUserList = function () {
            if (!$scope.userList.isVisible) {
                loadMemberUsersList()
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
                            loadMemberUsersList();
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

        $scope.toggleTab = function (tabName) {
            var items = $location.search();

            if (!items.openTabs) {
                items.openTabs = [];
            } else if (!Array.isArray(items.openTabs)) {
                items.openTabs = items.openTabs.split(',');
            }

            if (items.openTabs.indexOf(tabName) > -1) {
                items.openTabs.splice(items.openTabs.indexOf(tabName), 1);
            } else {
                items.openTabs.push(tabName);
            }
            items.openTabs = items.openTabs.join(',');
            var newParams = $stateParams;
            Object.keys(items).forEach(function(key) {
                newParams[key] = items[key];
            });
            $state.go($state.current.name, newParams, {location: true});
        };

        var checkTabs = function () {
            var tabsToOpen = $location.search();
            if (tabsToOpen.openTabs) {
                tabsToOpen.openTabs = tabsToOpen.openTabs.split(',');

                $scope.topicList.isVisible = false;
                $scope.userList.isVisible = false;

                tabsToOpen.openTabs.forEach(function (tabName) {
                    switch (tabName) {
                        case 'topic_list':
                            $scope.doToggleMemberTopicList();
                        break;
                        case 'user_list':
                            $scope.doToggleMemberUserList();
                        break;
                        default:
                        break;
                    }
                });
            }
        };
        checkTabs();

        loadMemberTopicsList();
        loadMemberUsersList();
    }]);
