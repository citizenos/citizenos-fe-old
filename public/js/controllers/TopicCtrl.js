'use strict';

angular
    .module('citizenos')
    .controller('TopicCtrl', ['$scope', '$state', '$stateParams', '$timeout', '$q', '$log', 'ngDialog', 'sAuth', 'TopicMemberGroup', 'TopicMemberUser', 'TopicVote', function ($scope, $state, $stateParams, $timeout, $q, $log, ngDialog, sAuth, TopicMemberGroup, TopicMemberUser, TopicVote) {
        $log.debug('TopicCtrl');

        $scope.topic = _.find($scope.itemList, {id: $stateParams.topicId});

        $scope.generalInfo = {
            isVisible: true
        };

        $scope.voteResults = {
            isVisible: false,
            countTotal: 0
        };

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

        $scope.doDeleteTopic = function (topic) {
            $log.debug('doDeleteTopic', topic);

            ngDialog
                .openConfirm({
                    template: '/views/modals/topic_delete_confirm.html'
                })
                .then(function () {
                    topic
                        .$delete()
                        .then(function () {
                            $state.go('my.topics', null, {reload: true});
                        });
                }, angular.noop);
        };

        $scope.doLeaveTopic = function (topic) {
            ngDialog
                .openConfirm({
                    template: '/views/modals/topic_member_user_leave_confirm.html',
                    data: {
                        topic: topic
                    }
                })
                .then(function () {
                    var topicMemberUser = new TopicMemberUser({id: sAuth.user.id});
                    topicMemberUser
                        .$delete({topicId: topic.id})
                        .then(function () {
                            $state.go('my.topics', null, {reload: true});
                        }, function (res) {
                            // FIXME: More generic handling
                            if (res.data.status.code === 40010) {
                                $scope.app.doShowNotification($scope.app.notifications.levels.ERROR, 'You cannot leave this Group as you are the last admin user of this Group. Please assign a new admin to leave.');
                            }
                        });
                });
        };

        $scope.doShowVoteResults = function (topic) {
            if (!$scope.voteResults.isVisible) {
                topic.vote
                    .$get({topicId: topic.id})
                    .then(function (topicVote) {
                        topic.vote = topicVote;
                        var voteCount = 0;
                        topicVote.options.rows.forEach(function (voteOption) {
                            voteCount += voteOption.voteCount || 0;
                        });
                        $scope.voteResults.countTotal = voteCount;
                        $scope.voteResults.isVisible = true;
                    });
            }
        };

        $scope.doToggleVoteResults = function (topic) {
            if ($scope.voteResults.isVisible) {
                $scope.voteResults.isVisible = false;
            } else {
                $scope.doShowVoteResults(topic);
            }
        };

        $scope.TopicMemberGroup = TopicMemberGroup;

        $scope.doToggleMemberGroupList = function (topic) {
            if ($scope.groupList.isVisible) {
                $scope.groupList.isVisible = false;
            } else {
                $scope.doShowMemberGroupList(topic);
            }
        };

        $scope.doShowMemberGroupList = function (topic) {
            if (!$scope.groupList.isVisible) {
                TopicMemberGroup
                    .query({topicId: topic.id}).$promise
                    .then(function (groups) {
                        topic.members.groups.rows = groups;
                        topic.members.groups.count = groups.length;
                        $scope.groupList.isVisible = true;
                        $scope.app.scrollToAnchor('group_list');
                    });
            } else {
                $scope.app.scrollToAnchor('group_list');
            }
        };

        $scope.doUpdateMemberGroup = function (topic, topicMemberGroup, level) {
            $log.debug('doUpdateMemberGroup', topic, topicMemberGroup, level);

            if (topicMemberGroup.level !== level) {
                var oldLevel = topicMemberGroup.level;
                topicMemberGroup.level = level;
                topicMemberGroup
                    .$update({topicId: topic.id})
                    .then(
                        function () {
                            if ($scope.userList.isVisible) { // Reload User list when Group permissions change as User permissions may also change
                                loadTopicMemberUserList(topic);
                            }
                        },
                        function () {
                            topicMemberGroup.level = oldLevel;
                        }
                    );
            }
        };

        $scope.doDeleteMemberGroup = function (topic, topicMemberGroup) {
            $log.debug('doDeleteMemberGroup', topic, topicMemberGroup);

            ngDialog
                .openConfirm({
                    template: '/views/modals/topic_member_group_delete_confirm.html',
                    data: {
                        group: topicMemberGroup
                    }
                })
                .then(function () {
                    topicMemberGroup
                        .$delete({topicId: topic.id})
                        .then(function () {
                            topic.members.groups.rows.splice(topic.members.groups.rows.indexOf(topicMemberGroup), 1);
                            topic.members.groups.count = topic.members.groups.rows.length;
                        });
                }, angular.noop);
        };

        $scope.TopicMemberUser = TopicMemberUser;

        var loadTopicMemberUserList = function (topic) {
            return TopicMemberUser
                .query({topicId: topic.id}).$promise
                .then(function (users) {
                    topic.members.users.rows = users;
                    topic.members.users.count = users.length;
                    $scope.userList.isVisible = true;
                });
        };

        $scope.doShowMemberUserList = function (topic) {
            if (!$scope.userList.isVisible) {
                loadTopicMemberUserList(topic)
                    .then(function () {
                        $scope.app.scrollToAnchor('user_list');
                    });
            } else {
                $scope.app.scrollToAnchor('user_list');
            }
        };

        $scope.doToggleMemberUserList = function (topic) {
            $log.debug('doToggleMemberUserList', topic);

            if ($scope.userList.isVisible) {
                $scope.userList.isVisible = false;
            } else {
                $scope.doShowMemberUserList(topic);
            }
        };

        $scope.doUpdateMemberUser = function (topic, topicMemberUser, level) {
            if (topicMemberUser.level !== level) {
                var oldLevel = topicMemberUser.level;
                topicMemberUser.level = level;
                topicMemberUser
                    .$update({topicId: topic.id})
                    .then(
                        angular.noop,
                        function (res) {
                            topicMemberUser.level = oldLevel;
                            // FIXME: More generic handling
                            if (res.data.status.code === 40000) {
                                $scope.app.doShowNotification($scope.app.notifications.levels.ERROR, 'You cannot change permissions as you are the last admin member of this Topic. Pleas assign a new admin to do so.');
                            }
                        });
            }
        };

        $scope.doDeleteMemberUser = function (topic, topicMemberUser) {
            ngDialog
                .openConfirm({
                    template: '/views/modals/topic_member_user_delete_confirm.html',
                    data: {
                        user: topicMemberUser
                    }
                })
                .then(function () {
                    topicMemberUser
                        .$delete({topicId: topic.id})
                        .then(function () {
                            return loadTopicMemberUserList(topic); // Good old topic.members.users.splice wont work due to group permission inheritance
                        }, function (res) {
                            $scope.app.doShowNotification($scope.app.notifications.levels.ERROR, res.data.status.message);
                        });
                }, angular.noop);
        };

    }]);
