'use strict';

angular
    .module('citizenos')
    .controller('GroupCtrl', ['$rootScope', '$scope', '$state', '$stateParams', '$log', '$location', '$q', 'ngDialog', 'sAuth', 'GroupMemberUser', 'GroupMemberTopic', 'rGroup', 'GroupInviteUser', function ($rootScope, $scope, $state, $stateParams, $log, $location, $q, ngDialog, sAuth, GroupMemberUser, GroupMemberTopic, rGroup, GroupInviteUser) {
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
        $scope.loadMemberTopicsList = function (offset, limit, order) {
            order = order || '';
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

            var statuses = ['inProgress', 'voting', 'followUp', 'closed'];
            var searchParams = {
                groupId: $scope.group.id,
                limit: limit,
                search: search,
                offset: offset
            };
            if (statuses.indexOf(order) > -1) {
                searchParams.statuses = order;
            }
            var param = order.split('.')[0];
            var sortOrder = order.split('.')[1];
            var orderParams = ['status', 'pinned', 'lastActivity'];
            if (orderParams.indexOf(param) > -1) {
                searchParams.order = param;
                if (sortOrder === 'descending') {
                    searchParams.sortOrder = 'desc';
                }
            }
            $scope.group.members.topics.order = order;
            return GroupMemberTopic
                .query(searchParams).$promise
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
            $scope.loadMemberTopicsList(offset, ITEMS_COUNT_PER_PAGE, $scope.group.members.topics.order);
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

        $scope.loadInviteUserList = function (offset, limit) {
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

            return GroupInviteUser
                .query({
                    groupId: $scope.group.id,
                    offset: offset,
                    search: search,
                    limit: limit
                }).$promise
                .then(function (invites) {
                    $scope.group.invites = {
                        users: {
                            rows: [],
                            count: 0
                        }
                    };

                    // Need to show only 1 line per User with maximum level
                    // NOTE: Objects don't actually guarantee order if keys parsed to number, it was better if TopicMemberUser.LEVELS was a Map
                    var levelOrder = Object.keys(GroupMemberUser.LEVELS);
                    var inviteListOrderedByLevel = _.orderBy(invites, function (invite) {
                        return levelOrder.indexOf(invite.level);
                    }, ['desc']);
                    $scope.group.invites.users._rows = invites; // Store the original result from server to implement DELETE ALL, need to know the ID-s of the invites to delete

                    $scope.group.invites.users.rows = _.sortedUniqBy(inviteListOrderedByLevel, 'user.id');
                    $scope.group.invites.users.count = invites.length;
                    if (invites.length) {
                        $scope.group.invites.users.count = invites[0].countTotal;
                    }

                    $scope.group.invites.users.totalPages = Math.ceil($scope.group.invites.users.count / limit);
                    $scope.group.invites.users.page = Math.ceil((offset + limit) / limit);

                    return invites;
                });
        };

        $scope.loadMemberUsersPage = function (page) {
            var offset = (page - 1) * ITEMS_COUNT_PER_PAGE;
            $scope.loadMemberUsersList(offset, ITEMS_COUNT_PER_PAGE);
        };

        $scope.loadUsersInvitedPage = function (page) {
            var offset = (page - 1) * ITEMS_COUNT_PER_PAGE;
            $scope.loadInviteUserList(offset, ITEMS_COUNT_PER_PAGE);
        };

        $scope.doShowMemberTopicList = function () {
            $scope.loadMemberTopicsList()
                .then(function () {
                    if ($scope.group.members.topics.count) {
                        $scope.topicList.isVisible = true;
                    }
                });
        };

        $scope.doToggleMemberTopicList = function () {
            var doShowList = $scope.topicList.isVisible;
            if ($scope.topicList.isVisible) {
                $scope.topicList.isVisible = !$scope.topicList.isVisible;
            }

            toggleTabParam('topic_list')
                .then(function () {
                    if (!doShowList) {
                        $scope.doShowMemberTopicList();
                        checkIfInView('topic_list');
                    }
                });
        };

        $scope.doOrderTopicList = function (order) {
            var param = order.split('.')[0];
            var sortOrder = order.split('.')[1];
            var statuses = ['inProgress', 'voting', 'followUp', 'closed'];
            $scope.loadMemberTopicsList(0, ITEMS_COUNT_PER_PAGE, order).then(function () {
                if (param === 'status') {
                    var mapped = $scope.group.members.topics.rows.map(function (v, i) {
                        return { i: i, value: statuses.indexOf(v.status) };
                    })

                    mapped.sort(function (a, b) {
                        if (a.value > b.value) {
                            if (sortOrder === 'descending') return -1;

                            return 1;
                        }
                        if (a.value < b.value) {
                            if (sortOrder === 'descending') return 1;

                            return -1;
                        }
                        return 0;
                    });
                    var result = mapped.map(function (v) { return $scope.group.members.topics.rows[v.i]});
                    $scope.group.members.topics.rows = result;
                } else if (param === 'pinned') {
                    var mapped = $scope.group.members.topics.rows.map(function (v, i) {
                        return { i: i, value: (v.pinned === true)? 1: -1 };
                    })
                    mapped.sort(function (a, b) {
                        if (a.value < b.value) {
                            if (sortOrder === 'descending') return -1;

                            return 1;
                        }
                        if (a.value > b.value) {
                            if (sortOrder === 'descending') return 1;

                            return -1;
                        }
                        return 0;
                    });
                    var result = mapped.map(function (v) { return $scope.group.members.topics.rows[v.i]});
                    $scope.group.members.topics.rows  = result
                } else if (param === 'activity') {
                    var now = (new Date()).getTime();
                    var mapped = $scope.group.members.topics.rows.map(function (v, i) {
                        return { i: i, value: now - (new Date(v.lastActivity)).getTime() };
                    });

                    mapped.sort(function (a, b) {
                        if (a.value > b.value) {
                            if (sortOrder === 'descending') return -1;

                            return 1;
                        }
                        if (a.value < b.value) {
                            if (sortOrder === 'descending') return 1;

                            return -1;
                        }
                        return 0;
                    });
                    var result = mapped.map(function (v) { return $scope.group.members.topics.rows[v.i]});
                    $scope.group.members.topics.rows  = result;
                }
            });
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
            return $q
                .all([$scope.loadMemberUsersList(), $scope.loadInviteUserList()])
                .then(function () {
                    $scope.userList.isVisible = true;
                });
        };

        $scope.doToggleMemberUserList = function () {
            var doShowList = $scope.userList.isVisible;
            if ($scope.userList.isVisible) {
                $scope.userList.isVisible = !$scope.userList.isVisible;
            }
            toggleTabParam('user_list')
                .then(function () {
                    if (!doShowList) {
                        $scope.doShowMemberUserList()
                            .then(function () {
                                checkIfInView('user_list');
                            });
                    }
                });
        };

        var toggleTabParam = function (tabName) {
            return new Promise(function (resolve) {
                var tabIndex;
                if ($stateParams.openTabs) {
                    tabIndex = $stateParams.openTabs.indexOf(tabName);
                }

                if (tabIndex > -1) {
                    if (!Array.isArray($stateParams.openTabs)) {
                        $stateParams.openTabs = null;
                    } else if ($stateParams.openTabs) {
                        $stateParams.openTabs.splice(tabIndex, 1);
                    }
                } else {
                    if (!$stateParams.openTabs) {
                        $stateParams.openTabs = [];
                    }
                    if (!Array.isArray($stateParams.openTabs)) {
                        $stateParams.openTabs = [$stateParams.openTabs];
                    }
                    $stateParams.openTabs.push(tabName);
                }

                $state.transitionTo($state.current.name, $stateParams, {
                    notify: true,
                    reload: false
                }).then(function () {
                    return resolve();
                });
            });

        };

        if ($stateParams.openTabs) {
            $scope.userList.isVisible = false;
            $scope.topicList.isVisible = false;
            if (!Array.isArray($stateParams.openTabs)) {
                $stateParams.openTabs = [$stateParams.openTabs];
            }
            $stateParams.openTabs.forEach(function (tab) {
                switch (tab) {
                    case 'user_list':
                        $scope.doShowMemberUserList();
                        break;
                    case 'topic_list':
                        $scope.doShowMemberTopicList();
                        break;
                }
            });
        }

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
            if (groupMemberUser.id === sAuth.user.id) { // IF User tries to delete himself, show "Leave" dialog instead
                $scope.doLeaveGroup();
            } else {
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
            }
        };

        $scope.doDeleteInviteUser = function (groupInviteUser) {
            ngDialog
                .openConfirm({
                    template: '/views/modals/group_invite_user_delete_confirm.html',
                    data: {
                        user: groupInviteUser.user
                    }
                })
                .then(function (isAll) {
                    var promisesToResolve = [];

                    // Delete all
                    if (isAll) {
                        $scope.group.invites.users._rows.forEach(function (invite) {
                            if (invite.user.id === groupInviteUser.user.id) {
                                promisesToResolve.push(invite.$delete({groupId: $scope.group.id}));
                            }
                        });
                    } else { // Delete single
                        promisesToResolve.push(groupInviteUser.$delete({groupId: $scope.group.id}));
                    }

                    $q
                        .all(promisesToResolve)
                        .then(function () {
                            return $scope.loadInviteUserList();
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

        var checkIfInView = function (elemId, from) {
            var elem = document.getElementById(elemId);
            var bounding = elem.getBoundingClientRect();

            if ((bounding.top + 100) > (window.scrollY + window.innerHeight)) {
                setTimeout(function () {
                    $scope.app.scrollToAnchor(elemId)
                }, 200);
            }
        };
    }]);
