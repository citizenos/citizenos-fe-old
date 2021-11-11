'use strict';

angular
    .module('citizenos')
    .controller('TopicMembersCtrl', ['$scope', '$log', '$stateParams', '$filter', '$location', 'ngDialog', 'sAuth', 'TopicMemberUser', 'TopicInviteUser', 'TopicMemberGroup', function ($scope, $log, $stateParams, $filter, $location, ngDialog, sAuth, TopicMemberUser, TopicInviteUser, TopicMemberGroup) {
        $log.debug('TopicMembersCtrl');

        $scope.topic.members = {
            users: [],
            groups: [],
            invited: []
        };

        $scope.tabSelected = $stateParams.tab || 'participants';

        var ITEMS_COUNT_PER_PAGE = 2;

        $scope.groupList = {
            isVisible: false,
            isSearchVisible: false,
            searchFilter: '',
            searchOrderBy: {
                property: 'name'
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

        $scope.inviteList = {
            isVisible: false,
            isSearchVisible: false,
            searchFilter: '',
            searchOrderBy: {
                property: 'name'
            }
        };

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
                    $scope.topic.members.users.rows = users;
                    $scope.topic.members.users.count = users.length;
                    if (users.length) {
                        $scope.topic.members.users.count = users[0].countTotal;
                    }

                    $scope.topic.members.users.totalPages = Math.ceil($scope.topic.members.users.count / limit);
                    $scope.topic.members.users.page = Math.ceil((offset + limit) / limit);
                    return users;
                });
        };

        $scope.loadMemberUsersPage = function (page) {
            var offset = (page - 1) * ITEMS_COUNT_PER_PAGE;
            $scope.loadMemberUserList(offset, ITEMS_COUNT_PER_PAGE);
        };

        $scope.loadInviteUserList = function (offset, limit) {
            if (!limit) {
                limit = ITEMS_COUNT_PER_PAGE;
            }
            if (!offset) {
                offset = 0;
            }

            var search = null;
            if ($scope.inviteList.searchFilter) {
                search = $scope.inviteList.searchFilter.trim();
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
                    $scope.topic.members.invited = {
                        rows: [],
                        count: 0
                    };

                    // Need to show only 1 line per User with maximum level
                    // NOTE: Objects don't actually guarantee order if keys parsed to number, it was better if TopicMemberUser.LEVELS was a Map
                    var levelOrder = Object.keys(TopicMemberUser.LEVELS);
                    var inviteListOrderedByLevel = _.orderBy(invites, function (invite) {
                        return levelOrder.indexOf(invite.level);
                    }, ['desc']);
                    $scope.topic.members.invited._rows = invites; // Store the original result from server to implement DELETE ALL, need to know the ID-s of the invites to delete

                    $scope.topic.members.invited.rows = _.sortedUniqBy(inviteListOrderedByLevel, 'user.id');
                    $scope.topic.members.invited.count = invites.length;
                    console.log($scope.topic.members);
                    if (invites.length) {
                        $scope.topic.members.invited.count = invites[0].countTotal;
                    }

                    $scope.topic.members.invited.totalPages = Math.ceil($scope.topic.members.invited.count / limit);
                    $scope.topic.members.invited.page = Math.ceil((offset + limit) / limit);

                    console.log($scope.topic.members);
                    return invites;
                });
        };

        $scope.loadUsersInvitedPage = function (page) {
            var offset = (page - 1) * ITEMS_COUNT_PER_PAGE;
            $scope.loadInviteUserList(offset, ITEMS_COUNT_PER_PAGE);
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
                    $scope.topic.members.groups.rows = groups;
                    $scope.topic.members.groups.count = groups.length;
                    if (groups.length) {
                        $scope.topic.members.groups.count = groups[0].countTotal;
                    }

                    $scope.topic.members.groups.totalPages = Math.ceil($scope.topic.members.groups.count / limit);
                    $scope.topic.members.groups.page = Math.ceil((offset + limit) / limit);
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
