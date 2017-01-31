'use strict';

angular
    .module('citizenos')
    .controller('GroupCreateSettingsCtrl', ['$scope', '$state', '$stateParams', '$log', 'sSearch', 'Group', 'GroupMemberUser', 'GroupMemberTopic', function ($scope, $state, $stateParams, $log, sSearch, Group, GroupMemberUser, GroupMemberTopic) {
        $scope.levels = {
            none: 0,
            read: 1,
            edit: 2,
            admin: 3
        };

        $scope.topicList = {
            searchFilter: '',
            searchOrderBy: {
                property: 'title'
            }
        };

        $scope.memberTopics = [];
        $scope.members = {
            users: [],
            emails: []
        };

        $scope.GroupMemberTopic = GroupMemberTopic;
        $scope.GroupMemberUser = GroupMemberUser;

        $scope.searchResults = {};
        $scope.searchStringUser = null;
        $scope.searchStringTopic = null;
        $scope.errors = {
            group: []
        };

        $scope.tabSelected = 'settings';

        var init = function () {
            // Group creation
            if (!$stateParams.groupId) {
                $scope.form.group = new Group({
                    id: null,
                    name: null,
                    visibility: Group.VISIBILITY.private
                });
            } else {
                // Create a copy of parent scopes Group, so that while modifying we don't change parent state
                $scope.form.group = angular.copy($scope.group);
            }

            $scope.memberTopics = [];
            $scope.Group = Group;
            $scope.GroupMemberTopic = GroupMemberTopic;
            $scope.GroupMemberUser = GroupMemberUser;
            $scope.searchStringUser = null;
            $scope.searchStringTopic = null;

            $scope.searchResults = {};
            $scope.errors = {
                group: []
            };
        };
        init();

        $scope.doSetGroupVisibility = function (visibility) {
            if (visibility == Group.VISIBILITY.private) {
                $scope.form.group.visibility = Group.VISIBILITY.public;
            }
            else {
                $scope.form.group.visibility = Group.VISIBILITY.private;
            }
        };

        $scope.search = function (str, type) {
            if (str && str.length >= 2) {
                var include = null;
                if (type == 'topic') {
                    include = 'my.topic';
                }
                else if (type == 'user') {
                    include = 'public.user';
                    $scope.searchStringUser = str;
                }
                sSearch
                    .searchV2(str, include)
                    .then(function (response) {
                            $scope.searchResults.users = [];
                            $scope.searchResults.topics = [];
                            if (type == 'user') {
                                response.data.data.results.public.users.forEach(function (user) {
                                    $scope.searchResults.users.push(user);
                                });
                            }
                            if (type == 'topic') {
                                response.data.data.results.my.topics.forEach(function (topic) {
                                    $scope.searchResults.topics.push(topic);
                                });
                            }

                        },
                        function (response) {
                            if (response.config.timeout && response.config.timeoutPromise) {
                                $log.info('Search canceled', response);
                            } else {
                                $log.error('Search failed...', response);
                            }
                        });
            } else {
                $scope.searchResults.users = [];
                $scope.searchResults.topics = [];
            }
        };

        $scope.addTopicToGroup = function (topic) {
            $scope.searchStringTopic = null;
            $scope.searchResults.topics = [];
            if (!topic || !topic.id || !topic.title) {
                return false;
            }
            var member = _.find($scope.memberTopics, function (o) {
                return o.id === topic.id;
            });
            if (!member) {
                topic.permission.level = 'read';
                $scope.memberTopics.push(topic);
            }
        };

        $scope.removeTopicFromGroup = function (topicId) {
            for (var i = 0; i < $scope.memberTopics.length; i++) {
                if ($scope.memberTopics[i].id === topicId) {
                    $scope.memberTopics.splice(i, 1);
                    i = $scope.memberTopics.length;
                }
            }
        };

        $scope.doSetGroupTopicLevel = function (topicId, level) {
            _.find($scope.memberTopics, function (o) {
                if (o.id === topicId) {
                    o.permission.level = level;
                    return true;
                }
            });
        };

        $scope.doOrderTopics = function (property) {
            if ($scope.topicList.searchOrderBy.property == property) {
                property = '-' + property;
            }
            $scope.topicList.searchOrderBy.property = property;
        };

        $scope.addUserAsMember = function (member) {
            if (member) {
                if (_.find($scope.members.users, {userId: member.id})) {
                    // Ignore duplicates
                    $scope.searchStringUser = null;
                    $scope.searchResults.topics = [];
                    return;
                } else {
                    var memberClone = angular.copy(member);
                    memberClone.userId = member.id;
                    memberClone.level = GroupMemberUser.LEVELS.read;

                    $scope.members.users.push(memberClone);
                    $scope.searchResults.users = [];
                }
            } else {
                // Assume e-mail was entered.
                if (validator.isEmail($scope.searchStringUser)) {
                    // Ignore duplicates
                    if (!_.find($scope.searchResults.results, {userId: $scope.searchStringUser})) {
                        $scope.members.emails.push({
                            userId: $scope.searchStringUser,
                            name: $scope.searchStringUser,
                            level: GroupMemberUser.LEVELS.read
                        });
                        $scope.searchResults.users = [];
                    }
                } else {
                    $log.debug('Ignoring member, as it does not look like e-mail', $scope.searchStringUser);
                }
            }
        };

        $scope.doRemoveMemberUser = function (member) {
            if (member.userId.indexOf('@') === -1) { // Remove existing User
                $scope.members.users.splice($scope.members.users.indexOf(member), 1);
            } else { // Remove User with e-mail
                $scope.members.emails.splice($scope.members.emails.indexOf(member), 1);
            }
        };

        $scope.doChangeMemberPermissions = function (member, level) {
            if (member.userId.indexOf('@') === -1) { // Edit existing User
                $scope.members.users[$scope.members.users.indexOf(member)].level = level;
            } else { // Add User with e-mail
                $scope.members.emails[$scope.members.emails.indexOf(member)].level = level;
            }
        };

        $scope.doSaveGroup = function () {
            if (!$scope.form.group.name) {
                $scope.errors.group.name = true;
                $scope.tabSelected = 'settings';
                return;
            }
            $scope.errors.group = [];

            var groupSavePromise;
            if (!$scope.form.group.id) {
                groupSavePromise = $scope.form.group.$save();
            } else {
                groupSavePromise = $scope.form.group.$update();
            }

            var savePromises = [];
            groupSavePromise
                .then(function (data) {
                    angular.extend($scope.form.group, data);

                    $scope.members.users.concat($scope.members.emails).forEach(function (user) {
                        var member = {
                            groupId: $scope.form.group.id,
                            level: user.level,
                            userId: user.userId
                        };
                        var groupMemberUser = new GroupMemberUser(member);
                        savePromises.push(
                            groupMemberUser.$save()
                        )
                    });

                    $scope.memberTopics.forEach(function (topic, key) {
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
                })
                .then(function () {
                    Promise.all(savePromises)
                        .then(function () {
                                $state.go('my.groups.groupId', {groupId: $scope.group.id}, {reload: true});
                            }, function (err) {
                                $log.error(err);
                            }
                        );
                });

        }

    }]);
