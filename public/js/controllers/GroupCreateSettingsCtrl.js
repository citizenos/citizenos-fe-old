'use strict';

angular
    .module('citizenos')
    .controller('GroupCreateSettingsCtrl', ['$scope', '$state', '$stateParams', '$timeout', '$log', '$location', 'sSearch', 'Group', 'GroupMemberUser', 'GroupMemberTopic', function ($scope, $state, $stateParams, $timeout, $log, $location, sSearch, Group, GroupMemberUser, GroupMemberTopic) {
        $log.debug('GroupCreateSettingsCtrl', $state, $stateParams);
        $scope.levels = {
            none: 0,
            read: 1,
            edit: 2,
            admin: 3
        };

        $scope.form = {
            group: null
        };

        $scope.memberGroups = ['users', 'emails'];
        $scope.tabSelected = $stateParams.tab || 'settings';

        $scope.topicList = {
            searchFilter: '',
            searchOrderBy: {
                property: 'title'
            }
        };
        var maxUsers = 50;
        var itemsPerPage = 10;

        var init = function () {
            // Group creation
            $scope.form = {
                group: null
            };
            if (!$stateParams.groupId) {
                $scope.form.group = new Group({
                    id: null,
                    name: null,
                    visibility: Group.VISIBILITY.private,
                    permission: {
                        level: GroupMemberUser.LEVELS.admin
                    }
                });
            } else {
                // Create a copy of parent scopes Group, so that while modifying we don't change parent state
                $scope.form.group = angular.copy($scope.group);
            }
            $scope.membersPage = 1;
            $scope.memberTopics = [];
            $scope.members = [];

            $scope.Group = Group;
            $scope.GroupMemberTopic = GroupMemberTopic;
            $scope.GroupMemberUser = GroupMemberUser;

            $scope.searchStringUser = null;
            $scope.searchStringTopic = null;
            $scope.searchResults = {};
            $scope.form.newMemberTopicTitle = null;
            $scope.form.newMemberTopicLevel = GroupMemberTopic.LEVELS.read;
            $scope.groupLevel = GroupMemberUser.LEVELS.read;

            $scope.errors = null;
        };
        init();

        $scope.search = function (str, type) {
            if (str && str.length >= 2) {
                var include = null;
                if (type === 'topic') {
                    include = 'my.topic';
                } else if (type === 'user') {
                    include = 'public.user';
                    $scope.searchStringUser = str;
                }
                sSearch
                    .searchV2(str, {include: include, 'my.topic.level': 'admin'})
                    .then(function (response) {
                        $scope.searchResults.users = [];
                        $scope.searchResults.topics = [];
                        if (type === 'user') {
                            response.data.data.results.public.users.rows.forEach(function (user) {
                                $scope.searchResults.users.push(user);
                            });
                        }
                        if (type === 'topic') {
                            response.data.data.results.my.topics.rows.forEach(function (topic) {
                                $scope.searchResults.topics.push(topic);
                            });
                        }

                    });
            } else {
                $scope.searchResults.users = [];
                $scope.searchResults.topics = [];
            }
        };

        $scope.addGroupMemberTopic = function (topic) {
            $scope.searchStringTopic = null;
            $scope.searchResults.topics = [];

            if (!topic || !topic.id || !topic.title) {
                return false;
            }
            var member = _.find($scope.memberTopics, function (o) {
                return o.id === topic.id;
            });

            if (!member) {
                topic.permission.level = GroupMemberTopic.LEVELS.read;
                $scope.memberTopics.push(topic);
            }
        };

        $scope.addNewGroupMemberTopic = function (title, newMemberTopicLevel) {
            $state.go('topics.create', {groupId: $scope.group.id, title: title, groupLevel: newMemberTopicLevel});
        }

        $scope.removeGroupMemberTopic = function (topic) {
            $scope.memberTopics.splice($scope.memberTopics.indexOf(topic), 1);
        };

        $scope.updateGroupMemberTopicLevel = function (topic, level) {
            topic.permission.level = level;
        };

        $scope.doOrderTopics = function (property) {
            if ($scope.topicList.searchOrderBy.property == property) {
                property = '-' + property;
            }
            $scope.topicList.searchOrderBy.property = property;
        };

        $scope.itemsExist = function (type) {
            var exists = false;
            var i = ($scope.membersPage * itemsPerPage) - itemsPerPage;
            for(i; i < $scope.members.length && i < ($scope.membersPage * itemsPerPage); i++) {
                if (type === 'users') {
                    if ($scope.members[i].id) {
                        exists = true;
                        break;
                    }
                } else if ($scope.members[i].userId === $scope.members[i].name){
                    exists = true;
                    break;
                }

            }

            return exists;
        };

        $scope.isInGroup = function (item, group) {
            if (group === 'emails') {
                return item.userId === item.name;
            } else {
                return item.userId !== item.name;
            }
        };

        $scope.removeAllMembers = function () {
            $scope.members = []
        };

        $scope.updateGroupLevel = function (level) {
            $scope.groupLevel = level;
            $scope.members.forEach(function (item) {
                item.level = $scope.groupLevel;
            });
        };

        $scope.loadPage = function (pageNr) {
            $scope.membersPage = pageNr;
        }
        $scope.totalPages = function (items) {
            return Math.ceil(items.length / itemsPerPage);
        };

        $scope.isOnPage = function (index, page) {
            var endIndex = page * itemsPerPage;
            return  (index >= (endIndex - itemsPerPage) && index < endIndex);
        }

        var orderMembers = function () {
            var compare = function(a, b) {
                var property = 'name';
                return (a[property] < b[property]) ? -1 : (a[property] > b[property]) ? 1 : 0;
            }
            var users = $scope.members.filter(function (member) {
                return !!member.id;
            }).sort(compare);
            var emails = $scope.members.filter(function (member) {
                return member.userId === member.name;
            }).sort(compare);

            $scope.members = users.concat(emails);
        };

        $scope.addGroupMemberUser = function (member) {
            if (member) {
                if (_.find($scope.members.users, {userId: member.id})) {
                    // Ignore duplicates
                    $scope.searchStringUser = null;
                    $scope.searchResults.users = [];
                    return;
                } else {
                    var memberClone = angular.copy(member);
                    memberClone.userId = member.id;
                    memberClone.level = GroupMemberUser.LEVELS.read;

                    $scope.members.push(memberClone);
                    $scope.searchResults.users = [];
                    orderMembers();
                }
            } else {
                var emails = $scope.searchStringUser.match(/(([^<>()\[\]\.,;:\s@\"]+(\.[^<>()\[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\.,;:\s@\"]+\.)+[^<>()[\]\.,;:\s@\"]{2,})/gi);
                var filtered = _.filter(emails, function (email) {
                    return validator.isEmail(email.trim())
                });
                if (!filtered.length) {
                    $log.debug('Ignoring member, as it does not look like e-mail', $scope.searchStringUser);
                    return;
                }
                _.sortedUniq(filtered.sort()).forEach(function (email) {
                    email = email.trim();
                    if ($scope.members.length >= maxUsers) {
                        sNotification.addError('MSG_ERROR_INVITE_MEMBER_COUNT_OVER_LIMIT');
                        return;
                    }
                    if (!_.find($scope.members, ['userId', email])) {
                        $scope.members.push({
                            userId: email,
                            name: email,
                            level: $scope.groupLevel
                        });
                        orderMembers();
                    }
                });
            }
        };

        $scope.doRemoveMemberUser = function (member) {
            $scope.members.splice($scope.members.indexOf(member), 1);
        };

        $scope.updateGroupMemberUserLevel = function (member, level) {
            $scope.members[$scope.members.indexOf(member)].level = level;
        };

        $scope.selectTab = function (tab) {
            $scope.tabSelected = tab;
            $location.search({tab: tab});
        };

        $scope.doSaveGroup = function () {
            $scope.errors = null;

            var groupSavePromise;
            if (!$scope.form.group.id) {
                groupSavePromise = $scope.form.group.$save();
            } else {
                groupSavePromise = $scope.form.group.$update();
            }

            groupSavePromise
                .then(
                    function (data) {
                        var savePromises = [];

                        angular.extend($scope.form.group, data);

                        // Users
                        var groupMemberUsersToSave = [];
                        $scope.members.forEach(function (member) {
                            groupMemberUsersToSave.push({
                                userId: member.userId,
                                level: member.level
                            })
                        });

                        if (groupMemberUsersToSave.length) {
                            savePromises.push(
                                GroupMemberUser.save({groupId: $scope.form.group.id}, groupMemberUsersToSave)
                            );
                        }

                        // Topics
                        // TODO: Once there is POST /groups/:groupId/members/topics use that
                        $scope.memberTopics.forEach(function (topic) {
                            var member = {
                                groupId: $scope.form.group.id,
                                id: topic.id,
                                level: topic.permission.level
                            };
                            var groupMemberTopic = new GroupMemberTopic(member);
                            savePromises.push(
                                groupMemberTopic.$save()
                            )
                        });

                        return Promise.all(savePromises)
                    }
                )
                .then(
                    function () {
                        $timeout(function () { // Avoid $digest already in progress
                            $state.go('my.groups.groupId', {groupId: $scope.form.group.id, filter: 'grouped'}, {reload: true});
                        });
                    },
                    function (errorResponse) {
                        if (errorResponse.data && errorResponse.data.errors) {
                            $scope.errors = errorResponse.data.errors;
                            $scope.tabSelected = 'settings';
                        }
                    }
                );
        }

    }]);
