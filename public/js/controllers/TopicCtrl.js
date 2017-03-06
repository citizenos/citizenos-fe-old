'use strict';

angular
    .module('citizenos')
    .controller('TopicCtrl', ['$scope', '$state', '$stateParams', '$timeout', '$q', '$log', '$sce', 'ngDialog', 'sAuth', 'Topic', 'TopicMemberGroup', 'TopicMemberUser', 'TopicComment', 'Mention', 'rTopic', function ($scope, $state, $stateParams, $timeout, $q, $log, $sce, ngDialog, sAuth, Topic, TopicMemberGroup, TopicMemberUser, TopicComment, Mention, rTopic) {
        $log.debug('TopicCtrl', $scope);
        $scope.topic = rTopic;

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

        $scope.topicComments = {
            rows: [],
            count: {
                pro: 0,
                con: 0
            },
            orderBy: TopicComment.COMMENT_ORDER_BY.date,
            orderByOptions: TopicComment.COMMENT_ORDER_BY
        };

        $scope.topic.padUrl = $sce.trustAsResourceUrl($scope.topic.padUrl);
        $scope.editMode = false;
        $scope.STATUSES = Topic.STATUSES;
        $scope.loadTopicComments = function () {
            $scope.topicComments.rows = [];
            $scope.topicComments.count = {
                pro: 0,
                con: 0
            };
            var topicComment = TopicComment.query({topicId:$scope.topic.id}).$promise
                .then(function(comments) {
                    if (comments) {
                        $scope.topicComments.count.pro = _.filter(comments, {type: TopicComment.COMMENT_TYPES.pro}).length;
                        $scope.topicComments.count.con = _.filter(comments, {type: TopicComment.COMMENT_TYPES.con}).length;
                        $scope.topicComments.rows = comments;
                    } else {
                        $scope.topicComments.rows = [];
                        $scope.topicComments.count = {
                            pro: 0,
                            con: 0
                        };
                    }
            });
        }

        $scope.loadTopicSocialMentions = function () {
            $scope.topicSocialMentions = Mention.query({topicId:$scope.topic.id});
        }
        $scope.loadTopicSocialMentions();

        $scope.orderComments = function (order) {
            $scope.topicComments.orderBy = order;
        }

        $scope.dotoggleEditMode = function () {
            $scope.editMode = !$scope.editMode;
        }

        $scope.doCommentVote = function (commentId, value) {
            if (!$scope.app.user.loggedIn) return;

            var topicComment = new TopicComment({id:commentId, topicId: $scope.topic.id});
            topicComment.value = value;
            topicComment.$vote()
            .then( function (data) {
                $scope.loadTopicComments();
            });
        };
        $scope.loadTopicComments();

        $scope.doDeleteTopic = function () {
            $log.debug('doDeleteTopic');

            ngDialog
                .openConfirm({
                    template: '/views/modals/topic_delete_confirm.html'
                })
                .then(function () {
                    $scope.topic
                        .$delete()
                        .then(function () {
                            $state.go('my.topics', null, {reload: true});
                        });
                }, angular.noop);
        };

        $scope.doLeaveTopic = function () {
            ngDialog
                .openConfirm({
                    template: '/views/modals/topic_member_user_leave_confirm.html',
                    data: {
                        topic: $scope.topic
                    }
                })
                .then(function () {
                    var topicMemberUser = new TopicMemberUser({id: sAuth.user.id});
                    topicMemberUser
                        .$delete({topicId: $scope.topic.id})
                        .then(function () {
                            $state.go('my.topics', null, {reload: true});
                        });
                });
        };

        $scope.doSetTopicStatus = function (status) {

            if(status !==$scope.topic.status) {
                $scope.topic.status = status;
                $scope.topic.$update(function (data) {
                    $scope.topic = Topic.get({topicId:$stateParams.topicId});
                });
            }
        };

        $scope.doShowVoteResults = function () {
            if (!$scope.voteResults.isVisible) {
                $scope.topic.vote
                    .$get({topicId: $scope.topic.id})
                    .then(function (topicVote) {
                        $scope.topic.vote = topicVote;
                        var voteCount = 0;
                        topicVote.options.rows.forEach(function (voteOption) {
                            voteCount += voteOption.voteCount || 0;
                        });
                        $scope.voteResults.countTotal = voteCount;
                        $scope.voteResults.isVisible = true;
                    });
            }
        };

        $scope.doToggleVoteResults = function () {
            if ($scope.voteResults.isVisible) {
                $scope.voteResults.isVisible = false;
            } else {
                $scope.doShowVoteResults();
            }
        };

        $scope.doSaveVoteEndsAt = function () {
            return $scope.topic.vote
                .$update({topicId: $scope.topic.id})
                .then(function (vote) {
                    // TODO: Reload from server until GET /:voteId and PUT /:voteId return the same output
                    return vote.$get({topicId: $scope.topic.id});
                });
        };

        $scope.TopicMemberGroup = TopicMemberGroup;

        $scope.doToggleMemberGroupList = function () {
            if ($scope.groupList.isVisible) {
                $scope.groupList.isVisible = false;
            } else {
                $scope.doShowMemberGroupList();
            }
        };

        $scope.doShowMemberGroupList = function () {
            if (!$scope.groupList.isVisible) {
                TopicMemberGroup
                    .query({topicId: $scope.topic.id}).$promise
                    .then(function (groups) {
                        $scope.topic.members.groups.rows = groups;
                        $scope.topic.members.groups.count = groups.length;
                        $scope.groupList.isVisible = true;
                        $scope.app.scrollToAnchor('group_list');
                    });
            } else {
                $scope.app.scrollToAnchor('group_list');
            }
        };

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
                                loadTopicMemberUserList();
                            }
                        },
                        function () {
                            topicMemberGroup.level = oldLevel;
                        }
                    );
            }
        };

        $scope.doDeleteMemberGroup = function (topicMemberGroup) {
            $log.debug('doDeleteMemberGroup', topicMemberGroup);

            ngDialog
                .openConfirm({
                    template: '/views/modals/topic_member_group_delete_confirm.html',
                    data: {
                        group: topicMemberGroup
                    }
                })
                .then(function () {
                    topicMemberGroup
                        .$delete({topicId: $scope.topic.id})
                        .then(function () {
                            $scope.topic.members.groups.rows.splice($scope.topic.members.groups.rows.indexOf(topicMemberGroup), 1);
                            $scope.topic.members.groups.count = $scope.topic.members.groups.rows.length;
                        });
                }, angular.noop);
        };

        $scope.TopicMemberUser = TopicMemberUser;

        var loadTopicMemberUserList = function () {
            return TopicMemberUser
                .query({topicId: $scope.topic.id}).$promise
                .then(function (users) {
                    $scope.topic.members.users.rows = users;
                    $scope.topic.members.users.count = users.length;
                    $scope.userList.isVisible = true;
                });
        };

        $scope.doShowMemberUserList = function () {
            if (!$scope.userList.isVisible) {
                loadTopicMemberUserList()
                    .then(function () {
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

        $scope.doUpdateMemberUser = function (topicMemberUser, level) {
            if (topicMemberUser.level !== level) {
                var oldLevel = topicMemberUser.level;
                topicMemberUser.level = level;
                topicMemberUser
                    .$update({topicId: $scope.topic.id})
                    .then(
                        angular.noop,
                        function (res) {
                            topicMemberUser.level = oldLevel;
                        });
            }
        };

        $scope.doDeleteMemberUser = function (topicMemberUser) {
            ngDialog
                .openConfirm({
                    template: '/views/modals/topic_member_user_delete_confirm.html',
                    data: {
                        user: topicMemberUser
                    }
                })
                .then(function () {
                    topicMemberUser
                        .$delete({topicId: $scope.topic.id})
                        .then(function () {
                            return loadTopicMemberUserList(); // Good old topic.members.users.splice wont work due to group permission inheritance
                        });
                }, angular.noop);
        };

    }]);
