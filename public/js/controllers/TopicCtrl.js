'use strict';

angular
    .module('citizenos')
    .controller('TopicCtrl', ['$rootScope', '$scope', '$state', '$stateParams', '$timeout', '$q', '$log', '$sce', '$translate', 'ngDialog', 'sAuth', 'sUpload', 'sActivity', 'Topic', 'TopicMemberGroup', 'TopicMemberUser', 'TopicComment', 'TopicVote', 'Mention', 'TopicAttachment', 'rTopic', function ($rootScope, $scope, $state, $stateParams, $timeout, $q, $log, $sce, $translate, ngDialog, sAuth, sUpload, sActivity, Topic, TopicMemberGroup, TopicMemberUser, TopicComment, TopicVote, Mention, TopicAttachment, rTopic) {
        $log.debug('TopicCtrl', $scope);

        $scope.topic = rTopic;
        if ($scope.topic) {
            $scope.topic.padUrl += '&theme=default';
        }
        $scope.ATTACHMENT_SOURCES = TopicAttachment.SOURCES;

        $scope.COMMENT_TYPES = TopicComment.COMMENT_TYPES;
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

        $scope.activities = [];
        $scope.topicComments = {
            rows: [],
            count: {
                pro: 0,
                con: 0
            },
            orderBy: TopicComment.COMMENT_ORDER_BY.date,
            orderByOptions: TopicComment.COMMENT_ORDER_BY

        };
        $scope.hashtagForm = {
            hashtag: null,
            errors: null,
            bytesLeft: 59
        };

        $scope.topic.padUrl = $sce.trustAsResourceUrl($scope.topic.padUrl);
        $scope.app.editMode = ($stateParams.editMode && $stateParams.editMode === 'true') || false;
        $scope.showInfoEdit = $scope.app.editMode;
        $scope.showVoteArea = false;

        $scope.STATUSES = Topic.STATUSES;

        if ($scope.topic.voteId || $scope.topic.vote) {
            $scope.topic.vote = new TopicVote({
                id: $scope.topic.voteId,
                topicId: $scope.topic.id
            });
            $scope.topic.vote.$get();
        }
        $scope.activitiesOffset = 0;
        $scope.activitiesLimit = 10;

        $scope.showActivityDescription = function (activity) {
            if (activity.data && activity.data.object && (Array.isArray(activity.data.object) && activity.data.object[0]['@type'] === 'Comment' || activity.data.object['@type'] === 'Comment' || activity.data.object.text)) {
                return true;
            }
            return false;
        };

        $scope.loadActivities = function (offset, limit) {
            $scope.activitiesOffset = offset || $scope.activitiesOffset;
            $scope.activitiesLimit = limit || $scope.activitiesLimit;
            if ($scope.activities.length && !offset && !limit) {
                $scope.activitiesOffset += $scope.activitiesLimit;
            }
            if ($scope.topic) {
                sActivity.getTopicActivities($scope.topic.id, $scope.activitiesOffset, $scope.activitiesLimit)
                    .then(function (activities) {
                        activities.forEach(function (activity) {
                            activity.values.topicTitle = $scope.topic.title;
                        });
                        $scope.showLoadMoreActivities = !(activities.length < $scope.activitiesLimit);
                        $scope.activities = $scope.activities.concat(activities);
                    });
            }
        };

        $scope.doToggleActivities = function () {
            $scope.app.activityFeed = !$scope.app.activityFeed;
            if ($scope.app.activityFeed) {
                $scope.showLoadMoreActivities = true;
                $scope.loadActivities(0);
            }
        };

        if ($scope.app.activityFeed) {
            $scope.showLoadMoreActivities = true;
            $scope.loadActivities(0);
        }

        $scope.showVoteCreate = function () {
            $scope.showVoteCreateForm = !$scope.showVoteCreateForm;
        };

        $scope.downloadAttachment = function (attachment) {

            sUpload.getSignedDownload(attachment.link, attachment.name, attachment.type).then(function (res) {
                var anchor = document.createElement('a');
                document.body.appendChild(anchor);
                anchor.href = res.data.data.url;

                var evObj = document.createEvent('MouseEvents');
                evObj.initMouseEvent('click', true, true, window);

                anchor.dispatchEvent(evObj);
                document.body.removeChild(anchor);
            });
        };

        $scope.sendToVote = function () {
            ngDialog
                .openConfirm({
                    template: '/views/modals/topic_send_to_vote_confirm.html'
                })
                .then(function () {
                    if (!$scope.topic.voteId && !$scope.topic.vote) {
                        $scope.app.topics_settings = false;
                        $state.go('topics.view.votes.create', {topicId: $scope.topic.id});
                    } else if (($scope.topic.voteId || $scope.topic.vote && $scope.topic.vote.id) && $scope.topic.status !== $scope.STATUSES.voting) {
                        $log.debug('sendToVote');
                        return new Topic({
                                id: $scope.topic.id,
                                status: $scope.STATUSES.voting
                            })
                            .$patch()
                            .then(
                                function (topicPatched) {
                                    $scope.topic.status = topicPatched.status;
                                    $scope.app.topics_settings = false;
                                    if ($state.is('topics.view')) {
                                        $state.go('topics.view.votes.view', {
                                            topicId: $scope.topic.id,
                                            voteId: $scope.topic.vote.id,
                                            editMode: null},
                                            {reload: true});
                                    }
                                }
                            );
                    }
                    return false;
                }, angular.noop);
        };

        $scope.sendToFollowUp = function () {
            ngDialog
                .openConfirm({
                    template: '/views/modals/topic_send_to_followUp_confirm.html'
                })
                .then(function () {
                    return new Topic({
                            id: $scope.topic.id,
                            status: $scope.STATUSES.followUp
                        })
                        .$patch()
                        .then(
                            function (topicPatched) {
                                $scope.topic.status = topicPatched.status;
                                $scope.app.topics_settings = false;
                                if ($state.is('topics.view.votes.view')) {
                                    $state.go('topics.view', {
                                            topicId: $scope.topic.id,
                                            editMode: null
                                        },
                                        {reload: true});
                                }
                            }
                        );
                }, angular.noop);
        };

        $scope.closeTopic = function () {
            ngDialog
                .openConfirm({
                    template: '/views/modals/topic_close_confirm.html'
                })
                .then(function () {
                    return new Topic({
                            id: $scope.topic.id,
                            status: $scope.STATUSES.closed
                        })
                        .$patch()
                        .then(
                            function (topicPatched) {
                                $scope.topic.status = topicPatched.status;
                                $scope.app.topics_settings = false;
                                if ($state.is('topics.view.votes.view')) {
                                    $state.go('topics.view', {topicId: $scope.topic.id}, {reload: true});
                                }
                            }
                        );
                }, angular.noop);
        };

        $scope.loadTopicSocialMentions = function () {
            if ($scope.topic.hashtag) {
                $scope.topicSocialMentions = Mention.query({topicId: $scope.topic.id});
            }
        };

        $scope.loadTopicSocialMentions();

        $scope.app.dotoggleEditMode = function () {
            $log.debug($scope.app.editMode);
            $scope.app.editMode = !$scope.app.editMode;
            $scope.app.topics_settings = false;
            if ($scope.app.editMode === true) {
                $state.go('topics.view', {
                    topicId: $scope.topic.id,
                    editMode: $scope.app.editMode
                });
            } else {
                $state.go('topics.view', {
                    topicId: $scope.topic.id,
                    editMode: null},
                    {reload: true});
            }
        };

        $scope.hideInfoEdit = function () {
            $scope.showInfoEdit = false
        };

        $scope.loadTopicComments = function () {
            $scope.topicComments.rows = [];
            $scope.topicComments.count = {
                pro: 0,
                con: 0
            };

            TopicComment.query({
                topicId: $scope.topic.id,
                orderBy: $scope.topicComments.orderBy
            }).$promise
                .then(function (comments) {
                    if (comments) {
                        $scope.topicComments.count.pro = _.filter(comments, {type: TopicComment.COMMENT_TYPES.pro}).length;
                        $scope.topicComments.count.con = _.filter(comments, {type: TopicComment.COMMENT_TYPES.con}).length;
                        $scope.topicComments.rows = comments;
                        $scope.topicComments.rows.forEach(function (comment, key) {
                            comment.replies.rows.forEach(function (reply, rkey) {
                                $scope.topicComments.rows[key].replies.rows[rkey] = new TopicComment(reply);
                            })
                        });
                    } else {
                        $scope.topicComments.rows = [];
                        $scope.topicComments.count = {
                            pro: 0,
                            con: 0
                        };
                    }
                });
        };

        $scope.loadTopicAttachments = function () {
            $scope.topicAttachments = TopicAttachment.query({topicId: $scope.topic.id});
        };

        $scope.loadTopicAttachments();

        $scope.orderComments = function (order) {
            $scope.topicComments.orderBy = order;
            $scope.loadTopicComments();
        };

        $scope.doCommentVote = function (commentId, value) {
            if (!$scope.app.user.loggedIn) {
                return;
            }

            var topicComment = new TopicComment({
                id: commentId,
                topicId: $scope.topic.id
            });
            topicComment.value = value;
            topicComment.$vote()
                .then(function () {
                    $scope.loadTopicComments();
                });
        };

        $scope.doCommentReport = function (comment) {
            ngDialog
                .open({
                    template: '/views/modals/topic_comment_report.html',
                    data: {
                        comment: comment,
                        topic: $scope.topic
                    }
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
            if (status !== $scope.topic.status) {
                $scope.topic.status = status;
                $scope.topic.$update(function (data) {
                    $scope.topic = Topic.get({topicId: $stateParams.topicId});
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
            if ($scope.groupList.isVisible) {
                $scope.app.scrollToAnchor('group_list');
            } else {
                TopicMemberGroup
                    .query({topicId: $scope.topic.id}).$promise
                    .then(function (groups) {
                        $scope.topic.members.groups.rows = groups;
                        $scope.topic.members.groups.count = groups.length;
                        $scope.groupList.isVisible = true;
                        $scope.app.scrollToAnchor('group_list');
                    });
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
                        function () {
                            topicMemberUser.levelUser = level;
                        },
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

        $scope.updateComment = function (comment, editType) {
            if (comment.editType != comment.type || comment.subject != comment.editSubject || comment.text != comment.editText) {
                comment.subject = comment.editSubject;
                comment.text = comment.editText;

                if (editType) {
                    comment.type = editType;
                }
                comment.topicId = $scope.topic.id;

                comment
                    .$update()
                    .then(function (res) {
                        $scope.loadTopicComments($scope.topicComments.orderBy);
                        $scope.commentEditMode(comment);

                    }, function (err) {
                        $log.error('err', err)
                    });
            } else {
                $scope.commentEditMode(comment);
            }
        };

        $scope.commentEditMode = function (comment) {
            comment.editSubject = comment.subject;
            comment.editText = comment.text;
            comment.showEdit = !comment.showEdit;
        };

        $scope.getParentAuthor = function (rootComment, parentId) {
            if (parentId === rootComment.id) {
                return rootComment.creator.name;
            } 
                for (var i = 0; i < rootComment.replies.rows.length; i++) {
                    if (rootComment.replies.rows[i].id === parentId) {
                        return rootComment.replies.rows[i].creator.name;
                        break;
                    }
                }
        };

        $scope.doShowDeleteComment = function (comment) {
            $log.debug('TopicCtrl.doShowDeleteComment()');

            ngDialog.openConfirm({
                    template: '/views/modals/topic_delete_comment.html',
                    data: {
                        comment: comment,
                        topic: $scope.topic
                    }
                })
                .then(function () {
                    comment.topicId = $scope.topic.id;
                    comment.$delete()
                        .then(function () {
                            $scope.loadTopicComments($scope.topicComments.orderBy);
                        }, angular.noop);
                });
        };

        $scope.goToParentComment = function (rootComment, parent) {

            if (!parent.id || !parent.hasOwnProperty('version')) {
                return
            }

            var comment = angular.element(document.getElementById(parent.id + parent.version));

            if (comment.length === 0) {
                for (var i = 0; i < $scope.topicComments.rows.length; i++) {
                    if ($scope.topicComments.rows[i].id === parent.id) {
                        $scope.topicComments.rows[i].showEdits = true;
                        $timeout(function () {
                            comment = angular.element(document.getElementById(parent.id + parent.version));
                            $scope.app.scrollToAnchor(comment[0].id);
                            comment.addClass('highlight');
                            $timeout(function () {
                                comment.removeClass('highlight');
                            }, 500);
                        }, 100);
                        break;
                    } else {
                        for (var j = 0; j < $scope.topicComments.rows[i].replies.rows.length; j++) {
                            if ($scope.topicComments.rows[i].replies.rows[j].id === parent.id) {
                                $scope.topicComments.rows[i].replies.rows[j].showEdits = true;
                                i = $scope.topicComments.rows.length;
                                $timeout(function () {
                                    comment = angular.element(document.getElementById(parent.id + parent.version));
                                    $scope.app.scrollToAnchor(comment[0].id);
                                    comment.addClass('highlight');
                                    $timeout(function () {
                                        comment.removeClass('highlight');
                                    }, 500);
                                }, 100);

                                break;
                            }
                        }
                    }
                }
            } else {
                $scope.app.scrollToAnchor(comment[0].id);
                comment.addClass('highlight');
                $timeout(function () {
                    comment.removeClass('highlight');
                }, 500);
            }
        };

        $scope.showActivityUpdateVersions = function (activity) {
            if (activity.data.type === 'Update') {
                if (activity.data.result && (Array.isArray(activity.data.object) && activity.data.object[0]['@type'] === 'Topic' && activity.data.result[0].path.indexOf('description') > -1 || !Array.isArray(activity.data.object) && activity.data.object['@type'] === 'Topic' && activity.data.result[0].path.indexOf('description') > -1)) {
                    return false;
                }

                if (
                    activity.data.result && !Array.isArray(activity.data.object) && activity.data.object['@type'] === 'TopicMemberUser' && activity.data.result[0].path.indexOf('level') > -1 && activity.data.result[0].value === 'none'
                ) {
                    return false;
                }
                return true;
            }
            return false;
        };

        $rootScope.$on('$stateChangeSuccess', function (event, toState, toParams, fromState) {
            if (fromState.name === 'topics.view.files') {
                $scope.loadTopicAttachments();
            }
            
        });
    }
]);
