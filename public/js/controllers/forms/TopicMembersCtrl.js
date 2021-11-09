'use strict';

angular
    .module('citizenos')
    .controller('TopicMembersCtrl', ['$scope', '$log', '$stateParams', '$filter', '$location', 'ngDialog', 'sAuth', 'TopicMemberUser', 'TopicInviteUser', 'TopicMemberGroup', function ($scope, $log, $stateParams, $filter, $location, ngDialog, sAuth, TopicMemberUser, TopicInviteUser, TopicMemberGroup) {
        $log.debug('TopicMembersCtrl');

        $scope.members = {
            users: [],
            groups: [],
            invited: []
        };

        $scope.tabSelected = $stateParams.tab || 'participants';

        var ITEMS_COUNT_PER_PAGE = 10;
        $scope.selectTab = function (tab) {
            $scope.tabSelected = tab
            $location.search({tab: tab});
        };

        $scope.loadMemberUserList = function (offset, limit) {
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

            return TopicMemberUser
                .query({
                    topicId: $scope.topic.id,
                    offset: offset,
                    search: search,
                    limit: limit
                }).$promise
                .then(function (users) {
                    $scope.members.users.rows = users;
                    $scope.members.users.count = users.length;
                    if (users.length) {
                        $scope.members.users.count = users[0].countTotal;
                    }

                    $scope.members.users.totalPages = Math.ceil($scope.members.users.count / limit);
                    $scope.members.users.page = Math.ceil((offset + limit) / limit);
                    return users;
                });
        };

        $scope.loadMemberUsersPage = function (page) {
            var offset = (page - 1) * ITEMS_COUNT_PER_PAGE;
            $scope.loadMemberUserList(offset, ITEMS_COUNT_PER_PAGE);
        };

        $scope.loadTopicInviteUserList = function (offset, limit) {
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

            return TopicInviteUser
                .query({
                    topicId: $scope.topic.id,
                    offset: offset,
                    search: search,
                    limit: limit
                }).$promise
                .then(function (invites) {
                    console.log(invites)
                    $scope.members.invited = {
                        rows: [],
                        count: 0
                    };

                    // Need to show only 1 line per User with maximum level
                    // NOTE: Objects don't actually guarantee order if keys parsed to number, it was better if TopicMemberUser.LEVELS was a Map
                    var levelOrder = Object.keys(TopicMemberUser.LEVELS);
                    var inviteListOrderedByLevel = _.orderBy(invites, function (invite) {
                        return levelOrder.indexOf(invite.level);
                    }, ['desc']);
                    $scope.members.invited._rows = invites; // Store the original result from server to implement DELETE ALL, need to know the ID-s of the invites to delete

                    $scope.members.invited.rows = _.sortedUniqBy(inviteListOrderedByLevel, 'user.id');
                    $scope.members.invited.count = invites.length;
                    console.log($scope.members);
                    if (invites.length) {
                        $scope.members.invited.count = invites[0].countTotal;
                    }

                    $scope.members.invited.totalPages = Math.ceil($scope.members.invited.count / limit);
                    $scope.members.invited.page = Math.ceil((offset + limit) / limit);

                    console.log($scope.members);
                    return invites;
                });
        };

        $scope.loadUsersInvitedPage = function (page) {
            var offset = (page - 1) * ITEMS_COUNT_PER_PAGE;
            $scope.loadTopicInviteUserList(offset, ITEMS_COUNT_PER_PAGE);
        };

        $scope.loadMemberGroupList = function (offset, limit) {
            if (!limit) {
                limit = ITEMS_COUNT_PER_PAGE;
            }
            if (!offset) {
                offset = 0;
            }
            var search = null;
            if ($scope.groupList.searchFilter) {
                search = $scope.groupList.searchFilter.trim();
            }

            return TopicMemberGroup
                .query({
                    topicId: $scope.topic.id,
                    offset: offset,
                    search: search,
                    limit: limit
                }).$promise
                .then(function (groups) {
                    $scope.members.groups.rows = groups;
                    $scope.members.groups.count = groups.length;
                    if (groups.length) {
                        $scope.members.groups.count = groups[0].countTotal;
                    }

                    $scope.members.groups.totalPages = Math.ceil($scope.members.groups.count / limit);
                    $scope.members.groups.page = Math.ceil((offset + limit) / limit);
                    return groups;
                });
        };

        $scope.loadMemberGroupPage = function (page) {
            var offset = (page - 1) * ITEMS_COUNT_PER_PAGE;
            $scope.loadMemberGroupList(offset, ITEMS_COUNT_PER_PAGE);
        };

        $scope.loadMemberUsersPage();
        $scope.loadMemberGroupPage();
        $scope.loadUsersInvitedPage();
    }]);
