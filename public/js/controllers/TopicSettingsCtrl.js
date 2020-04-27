'use strict';

angular
    .module('citizenos')
    .controller('TopicSettingsCtrl', ['$scope', '$state', '$stateParams', '$log', '$location', 'sSearch', 'sLocation', 'Topic', 'TopicInviteUser', 'TopicMemberUser', 'TopicMemberGroup', 'TopicVote', function ($scope, $state, $stateParams, $log, $location, sSearch, sLocation, Topic, TopicInviteUser, TopicMemberUser, TopicMemberGroup, TopicVote) {
        $log.debug('TopicSettingsCtrl', $state, $stateParams);

        $scope.levels = {
            none: 0,
            read: 1,
            edit: 2,
            admin: 3
        };
        $scope.form = {
            topic: null,
            description: null,
            urlJoin: null
        };
        $scope.cosToggleTextOn = 'public';
        $scope.tabSelected = $stateParams.tab || 'settings';

        $scope.topicList = {
            searchFilter: '',
            searchOrderBy: {
                property: 'title'
            }
        };

        var init = function () {
            // Create a copy of parent scopes Topic, so that while modifying we don't change parent state
            $scope.form = {
                topic: null,
                description: null,
                urlJoin: null
            };
            $scope.form.topic = angular.copy($scope.topic);

            if ($scope.topic.status === Topic.STATUSES.voting && $scope.topic.voteId) {
                new TopicVote({topicId: $scope.topic.id, id: $scope.topic.voteId})
                    .$get()
                    .then(function (topicVote) {
                        $scope.topic.vote = topicVote;
                        $scope.form.topic.vote = angular.copy(topicVote);
                    });
            }

            $scope.form.description = angular.element($scope.topic.description).text().replace($scope.topic.title, '');
            $scope.memberGroups = [];
            $scope.members = {
                users: [],
                emails: [],
                groups: []
            };

            $scope.Topic = Topic;
            $scope.TopicMemberUser = TopicMemberUser;
            $scope.TopicMemberGroup = TopicMemberGroup;

            $scope.searchString = null;
            $scope.searchResults = {};

            $scope.errors = null;

            $scope.generateJoinUrl();
        };

        $scope.search = function (str) {
            $scope.searchString = str; // TODO: Hackish - Typeahead has term="searchString" but somehow the 2 way binding does not work there, investigate when time
            if (str && str.length >= 2) {
                var include = ['my.group', 'public.user'];
                sSearch
                    .searchV2(str, {include: include})
                    .then(function (response) {
                        $scope.searchResults.users = [];
                        $scope.searchResults.groups = [];
                        $scope.searchResults.emails = [];
                        $scope.searchResults.combined = [];
                        if (response.data.data.results.public.users.rows.length) {
                            response.data.data.results.public.users.rows.forEach(function (user) {
                                $scope.searchResults.users.push(user);
                            });
                        }
                        else if (validator.isEmail(str)) {
                            $scope.searchResults.emails.push($scope.searchString);
                        }
                        if (response.data.data.results.my.groups.rows.length) {
                            response.data.data.results.my.groups.rows.forEach(function (group) {
                                $scope.searchResults.groups.push(group);
                            });
                        }
                        $scope.searchResults.combined = $scope.searchResults.users.concat($scope.searchResults.groups).concat($scope.searchResults.emails);
                    });
            } else {
                $scope.searchResults.users = [];
                $scope.searchResults.emails = [];
                $scope.searchResults.groups = [];
                $scope.searchResults.combined = [];
            }
        };

        $scope.checkHashtag = function () {
            var length = 0;
            var str = $scope.form.topic.hashtag;
            var hashtagMaxLength = 59;

            if (str) {
                length = str.length;
                for (var i = 0; i < str.length; i++) {
                    var code = str.charCodeAt(i);
                    if (code > 0x7f && code <= 0x7ff) length++;
                    else if (code > 0x7ff && code <= 0xffff) length += 2;
                    if (code >= 0xDC00 && code <= 0xDFFF) i++; //trail surrogate
                }
            }

            if ((hashtagMaxLength - length) < 0) {
                $scope.errors = {hashtag: 'MSG_ERROR_40000_TOPIC_HASHTAG'};
            }
            else if ($scope.errors && $scope.errors.hashtag) {
                $scope.errors.hashtag = null;
            }
        };

        $scope.doDeleteHashtag = function () {
            $scope.form.topic.hashtag = null;
        };

        $scope.doEditVoteDeadline = function () {

            $scope.form.topic.vote.topicId = $scope.topic.id;
            return $scope.form.topic.vote
                .$update();
        };

        $scope.generateTokenJoin = function () { //TODO: update when PATCH support is added, because this is a very ugly solution,
            $scope.topic.$updateTokenJoin()
                .then(function () {
                    Topic
                        .query()
                        .$promise
                        .then(function (topics) {
                            if (topics) {
                                $scope.topic = _.find(topics, {id: $stateParams.topicId});
                                $scope.form.topic.tokenJoin = $scope.topic.tokenJoin;
                                $scope.generateJoinUrl();
                            }
                        });
                });
        };

        $scope.selectTab = function (tab) {
            $scope.tabSelected = tab;
            $location.search({tab: tab});
        };

        $scope.copyInviteLink = function () {
            var urlInputElement = document.getElementById('url_invite_topic_input');
            urlInputElement.focus();
            urlInputElement.select();
            urlInputElement.setSelectionRange(0, 99999);
            document.execCommand('copy');
        };

        $scope.generateJoinUrl = function () {
            if ($scope.topic.tokenJoin && $scope.topic.canUpdate()) {
                $scope.form.urlJoin = sLocation.getAbsoluteUrl('/join/' + $scope.topic.tokenJoin);
            }
        };

        $scope.addTopicCategory = function (category) {
            if ($scope.form.topic.categories.indexOf(category) === -1 && $scope.form.topic.categories.length < Topic.CATEGORIES_COUNT_MAX) {
                $scope.form.topic.categories.push(category);
            }
        };

        $scope.removeTopicCategory = function (category) {
            $scope.form.topic.categories.splice($scope.form.topic.categories.indexOf(category), 1);
        };

        $scope.addTopicMember = function (member) {
            if (!member || validator.isEmail(member)) {
                $scope.addTopicMemberUser();
            }
            if (member.hasOwnProperty('company')) {
                $scope.addTopicMemberUser(member);
            } else {
                $scope.addTopicMemberGroup(member);
            }
        };

        $scope.addTopicMemberGroup = function (group) {
            $scope.searchString = null;
            $scope.searchResults.users = [];
            $scope.searchResults.groups = [];
            $scope.searchResults.emails = [];
            $scope.searchResults.combined = [];

            if (!group || !group.id || !group.name) {
                return false;
            }
            var member = _.find($scope.memberGroups, function (o) {
                return o.id === group.id;
            });

            if (!member) {
                var memberClone = angular.copy(group);
                memberClone.groupId = group.id;
                memberClone.level = TopicMemberGroup.LEVELS.read;

                $scope.members.groups.push(memberClone);
            }
        };

        $scope.removeTopicMemberGroup = function (group) {
            $scope.members.groups.splice($scope.members.groups.indexOf(group), 1);
        };

        $scope.updateTopicMemberGroupLevel = function (group, level) {
            $scope.members.groups[$scope.members.groups.indexOf(group)].level = level;
        };

        $scope.doOrderTopics = function (property) {
            if ($scope.topicList.searchOrderBy.property == property) {
                property = '-' + property;
            }
            $scope.topicList.searchOrderBy.property = property;
        };

        $scope.addTopicMemberUser = function (member) {
            if (member) {
                if (_.find($scope.members.users, {userId: member.id})) {
                    // Ignore duplicates
                    $scope.searchString = null;
                    $scope.searchResults.users = [];
                    $scope.searchResults.groups = [];
                    $scope.searchResults.emails = [];
                    $scope.searchResults.combined = [];
                    return;
                } else {
                    var memberClone = angular.copy(member);
                    memberClone.userId = member.id;
                    memberClone.level = TopicMemberUser.LEVELS.read;

                    $scope.members.users.push(memberClone);
                    $scope.searchResults.groups = [];
                    $scope.searchResults.users = [];
                    $scope.searchResults.emails = [];
                    $scope.searchResults.combined = [];
                }
            } else {
                // Assume e-mail was entered.
                if (validator.isEmail($scope.searchString)) {
                    // Ignore duplicates
                    if (!_.find($scope.searchResults.results, {userId: $scope.searchString})) {
                        $scope.members.emails.push({
                            userId: $scope.searchString,
                            name: $scope.searchString,
                            level: TopicMemberUser.LEVELS.read
                        });
                        $scope.searchResults.groups = [];
                        $scope.searchResults.users = [];
                        $scope.searchResults.emails = [];
                        $scope.searchResults.combined = [];
                    }
                } else {
                    $log.debug('Ignoring member, as it does not look like e-mail', $scope.searchString);
                }
            }
        };

        $scope.removeTopicMemberUser = function (member) {
            if (member.userId.indexOf('@') === -1) { // Remove existing User
                $scope.members.users.splice($scope.members.users.indexOf(member), 1);
            } else { // Remove User with e-mail
                $scope.members.emails.splice($scope.members.emails.indexOf(member), 1);
            }
        };

        $scope.updateTopicMemberUserLevel = function (member, level) {
            if (member.userId.indexOf('@') === -1) { // Edit existing User
                $scope.members.users[$scope.members.users.indexOf(member)].level = level;
            } else { // Add User with e-mail
                $scope.members.emails[$scope.members.emails.indexOf(member)].level = level;
            }
        };

        $scope.doSaveTopic = function () {
            $scope.errors = null;

            if ($scope.form.topic.visibility === true || $scope.form.topic.visibility === 'private') {
                $scope.form.topic.visibility = 'private';
            } else {
                $scope.form.topic.visibility = 'public';
            }
            if ($scope.form.topic.endsAt && $scope.topic.endsAt === $scope.form.topic.endsAt) { //Remove endsAt field so that topics with endsAt value set could be updated if endsAt is not changed
                delete $scope.form.topic.endsAt;
            }
            $scope.form.topic
                .$update()
                .then(function (data) {
                    var savePromises = [];
                    // Users
                    var topicMemberUsersToSave = [];
                    $scope.members.users.concat($scope.members.emails).forEach(function (member) {
                        topicMemberUsersToSave.push({
                            userId: member.userId,
                            level: member.level
                        })
                    });

                    if (topicMemberUsersToSave.length) {
                        savePromises.push(
                            TopicInviteUser.save({topicId: $scope.topic.id}, topicMemberUsersToSave)
                        );
                    }

                    // Groups
                    $scope.members.groups.forEach(function (group) {
                        var member = {
                            id: group.id,
                            topicId: $scope.topic.id,
                            level: group.level
                        };
                        var topicMemberGroup = new TopicMemberGroup(member);
                        savePromises.push(
                            topicMemberGroup.$save()
                        )
                    });

                    return Promise.all(savePromises)
                })
                .then(
                    function () {
                        $state.go($state.current.parent, {topicId: $scope.topic.id}, {reload: true});
                    },
                    function (errorResponse) {
                        if (errorResponse.data && errorResponse.data.errors) {
                            $scope.errors = errorResponse.data.errors;
                        }
                    }
                );
        };

        init();
    }]);
