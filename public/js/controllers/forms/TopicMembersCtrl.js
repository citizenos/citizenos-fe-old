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
            isSearchVisible: false,
            searchFilter: '',
            searchOrderBy: {
                property: 'name',
                sortOrder: 'ASC'
            }
        };

        $scope.userList = {
            isSearchVisible: false,
            searchFilter: '',
            searchOrderBy: {
                property: 'name',
                sortOrder: 'ASC'
            }
        };

        $scope.inviteList = {
            isSearchVisible: false,
            searchFilter: '',
            searchOrderBy: {
                property: 'name',
                sortOrder: 'ASC'
            }
        };

        $scope.selectTab = function (tab) {
            $scope.tabSelected = tab
            $location.search({tab: tab});
        };

        $scope.loadMemberUserList = function (offset, limit, order, sortOrder) {
            if (!limit) {
                limit = ITEMS_COUNT_PER_PAGE;
            }
            if (!offset) {
                offset = 0;
            }
            if (order) {
                $scope.userList.searchOrderBy.property = order;
            }
            if (sortOrder) {
                $scope.userList.searchOrderBy.sortOrder = sortOrder;
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
                    limit: limit,
                    order: $scope.userList.searchOrderBy.property,
                    sortOrder: $scope.userList.searchOrderBy.sortOrder
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

        $scope.sortParticipants  = function (property) {
            if (property === $scope.userList.searchOrderBy.property && $scope.userList.searchOrderBy.sortOrder === 'ASC') {
               order = 'DESC'
            } else {
                order = 'ASC'
            }

            $scope.loadMemberUserList(0, ITEMS_COUNT_PER_PAGE, property, order);
        }

        $scope.doUpdateMemberUser = function (topicMemberUser, level) {
            if (topicMemberUser.level !== level) {
                var oldLevel = topicMemberUser.level;
                topicMemberUser.level = level;
                topicMemberUser
                    .$update({topicId: $scope.topic.id})
                    .then(
                        function () {
                            topicMemberUser.levelUser = level;
                        },
                        function (res) {
                            topicMemberUser.level = oldLevel;
                        });
            }
        };

        $scope.loadInviteUserList = function (offset, limit, order, sortOrder) {
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

            if (order) {
                $scope.inviteList.searchOrderBy.property = order;
            }
            if (sortOrder) {
                $scope.inviteList.searchOrderBy.sortOrder = sortOrder;
            }

            return TopicInviteUser
                .query({
                    topicId: $scope.topic.id,
                    offset: offset,
                    search: search,
                    limit: limit,
                    order: $scope.inviteList.searchOrderBy.property,
                    sortOrder: $scope.inviteList.searchOrderBy.sortOrder
                }).$promise
                .then(function (invites) {
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
                    if (invites.length) {
                        $scope.topic.members.invited.count = invites[0].countTotal;
                    }

                    $scope.topic.members.invited.totalPages = Math.ceil($scope.topic.members.invited.count / limit);
                    $scope.topic.members.invited.page = Math.ceil((offset + limit) / limit);

                    return invites;
                });
        };

        $scope.loadUsersInvitedPage = function (page) {
            var offset = (page - 1) * ITEMS_COUNT_PER_PAGE;
            $scope.loadInviteUserList(offset, ITEMS_COUNT_PER_PAGE);
        };

        $scope.sortInvites = function (property) {
            if (property === $scope.inviteList.searchOrderBy.property && $scope.inviteList.searchOrderBy.sortOrder === 'ASC') {
               order = 'DESC'
            } else {
                order = 'ASC'
            }

            $scope.loadInviteUserList(0, ITEMS_COUNT_PER_PAGE, property, order);
        }

        $scope.doUpdateInvite = function (topicInviteUser, level) {
            $log.debug('doUpdateMemberGroup', topicInviteUser, level);

            if (topicInviteUser.level !== level) {
                var oldLevel = topicInviteUser.level;
                topicInviteUser.level = level;
                topicInviteUser
                    .$update({topicId: $scope.topic.id})
                    .then(
                        function () {
                            topicInviteUser.level = level;
                        },
                        function () {
                            topicInviteUser.level = oldLevel;
                        }
                    );
            }
        };

        $scope.loadMemberGroupList = function (offset, limit, order, sortOrder) {
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

            if (order) {
                $scope.groupList.searchOrderBy.property = order;
            }
            if (sortOrder) {
                $scope.groupList.searchOrderBy.sortOrder = sortOrder;
            }

            return TopicMemberGroup
                .query({
                    topicId: $scope.topic.id,
                    offset: offset,
                    order: $scope.groupList.searchOrderBy.property,
                    sortOrder: $scope.groupList.searchOrderBy.sortOrder,
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

        $scope.sortGroups  = function (property) {
            if (property === $scope.groupList.searchOrderBy.property && $scope.groupList.searchOrderBy.sortOrder === 'ASC') {
               order = 'DESC'
            } else {
                order = 'ASC'
            }

            $scope.loadMemberGroupList(0, ITEMS_COUNT_PER_PAGE, property, order);
        }

        $scope.doUpdateMemberGroup = function (topicMemberGroup, level) {
            $log.debug('doUpdateMemberGroup', topicMemberGroup, level);

            if (topicMemberGroup.level !== level) {
                var oldLevel = topicMemberGroup.level;
                topicMemberGroup.level = level;
                topicMemberGroup
                    .$update({topicId: $scope.topic.id})
                    .then(
                        function () {
                            if ($scope.userList.isVisible) { // Reload User list when Group permissions change as User permissions may also change
                                $scope.loadTopicMemberUserList();
                            }
                        },
                        function () {
                            topicMemberGroup.level = oldLevel;
                        }
                    );
            }
        };

        $scope.loadMemberUsersPage();
        $scope.loadMemberGroupPage();
        $scope.loadUsersInvitedPage();
    }]);
