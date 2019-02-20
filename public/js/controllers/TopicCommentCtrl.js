'use strict';

angular
    .module('citizenos')
    .controller('TopicCommentCtrl', ['$scope', '$state', '$stateParams', '$timeout', '$log', '$translate', 'ngDialog', 'TopicComment', function ($scope, $state, $stateParams, $timeout, $log, $translate, ngDialog, TopicComment) {
        $log.debug('TopicCommentCtrl', $scope, $scope.topic, $stateParams.topicId);

        $scope.topic = $scope.topic || {id: $stateParams.topicId};

        var commentsLimit = 10;

        $scope.topicComments = {
            rows: [],
            count: {
                pro: 0,
                con: 0
            },
            page: 1,
            totalPages: 0,
            orderBy: TopicComment.COMMENT_ORDER_BY.date,
            orderByTranslation: $translate.instant('VIEWS.TOPICS_TOPICID.TXT_ARGUMENT_ORDER_BY_DATE'),
            orderByOptions: TopicComment.COMMENT_ORDER_BY

        };
        Object.keys($scope.topicComments.orderByOptions).forEach(function (option, key) {
            var translation = $translate.instant('VIEWS.TOPICS_TOPICID.TXT_ARGUMENT_ORDER_BY_' + option.toUpperCase());
            $scope.topicComments.orderByOptions[option] = {value: option, translation: translation};
        });

        $scope.COMMENT_TYPES = TopicComment.COMMENT_TYPES;

        $scope.loadPage = function (page) {
            var offset = (page - 1) * commentsLimit;
            $scope.loadTopicComments(offset, commentsLimit);
        };

        $scope.loadTopicComments = function (offset, limit) {
            if (!limit) {
                limit = commentsLimit;
            }
            if (!offset) {
                offset = 0;
            }

            TopicComment
                .query({
                    topicId: $scope.topic.id,
                    orderBy: $scope.topicComments.orderBy,
                    offset: offset,
                    limit: limit
                })
                .$promise
                .then(function (comments) {
                    if (comments && comments.length) {
                        $scope.topicComments.count = comments[0].count;
                        $scope.topicComments.totalPages = Math.ceil($scope.topicComments.count.total / limit);
                        $scope.topicComments.page = Math.ceil((offset + limit) / limit);

                        $stateParams.argumentsPage = $scope.topicComments.page;
                        $state.transitionTo($state.current.name, $stateParams, {notify: false, reload: false});
                        
                        $scope.topicComments.rows = comments;
                        $scope.topicComments.rows.forEach(function (comment, key) {
                            if (comment.deletedReasonType) {
                                $scope.topicComments.rows[key].deletedReasonType = $translate.instant('TXT_REPORT_TYPES_' + comment.deletedReasonType.toUpperCase());
                            }
                            comment.replies.rows.forEach(function (reply, rkey) {
                                $scope.topicComments.rows[key].replies.rows[rkey] = new TopicComment(reply);
                                if (reply.deletedReasonType) {
                                    $scope.topicComments.rows[key].replies.rows[rkey].deletedReasonType = $translate.instant('TXT_REPORT_TYPES_' + comment.deletedReasonType.toUpperCase());
                                }
                            })
                        });
                    } else {
                        $scope.topicComments.rows = [];
                        $scope.topicComments.count = {
                            pro: 0,
                            con: 0,
                            total: 0
                        };
                    }

                    if ($scope.topic) { // For the arguments count on the /topics/:topicId, not beautiful. Will do until /topics/:topicId API returns comments count.
                        $scope.topic.comments = $scope.topicComments;
                    }

                    $timeout(function () {
                        if ($stateParams.commentId) {
                            $scope.gotToComment($stateParams.commentId);
                        }
                    });
                });
        };

        $scope.orderComments = function (order) {
            $scope.topicComments.orderBy = order;
            $scope.topicComments.orderByTranslation = $translate.instant('VIEWS.TOPICS_TOPICID.TXT_ARGUMENT_ORDER_BY_' + order.toUpperCase());
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
                        topic: {
                            id: $scope.topic.id
                        }
                    }
                });
        };

        $scope.loadPage($stateParams.argumentsPage || 1);

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
                    .then(function () {
                        $scope.loadTopicComments();
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
            $log.debug('TopicCommentCtrl.doShowDeleteComment()');

            ngDialog.openConfirm({
                    template: '/views/modals/topic_delete_comment.html',
                    data: {
                        comment: comment
                    }
                })
                .then(function () {
                    comment.topicId = $scope.topic.id;
                    comment.$delete()
                        .then(function () {
                            $scope.loadTopicComments();
                        }, angular.noop);
                });
        };

        $scope.doShowDeleteReply = function (comment) {
            $log.debug('TopicCommentCtrl.doShowDeleteReply()');

            ngDialog.openConfirm({
                    template: '/views/modals/topic_delete_reply.html',
                    data: {
                        comment: comment
                    }
                })
                .then(function () {
                    comment.topicId = $scope.topic.id;
                    comment.$delete()
                        .then(function () {
                            $scope.loadTopicComments();
                        }, angular.noop);
                });
        };

        $scope.gotToComment = function (commentId, version) {
            if (version !== 0 && !version) {
                version = 0;
            }

            var comment = angular.element(document.getElementById(commentId + version));
            if (comment.length === 0) {
                for (var i = 0; i < $scope.topicComments.rows.length; i++) {
                    if ($scope.topicComments.rows[i].id === commentId) {
                        $scope.topicComments.rows[i].showEdits = true;
                        $timeout(function () {
                            comment = angular.element(document.getElementById(commentId + version));
                            $scope.app.scrollToAnchor(comment[0].id);
                            comment.addClass('highlight');
                            $timeout(function () {
                                comment.removeClass('highlight');
                            }, 500);
                        }, 100);
                        break;
                    } else {
                        for (var j = 0; j < $scope.topicComments.rows[i].replies.rows.length; j++) {
                            if ($scope.topicComments.rows[i].replies.rows[j].id === commentId) {
                                $scope.topicComments.rows[i].replies.rows[j].showEdits = true;
                                i = $scope.topicComments.rows.length;
                                $timeout(function () {
                                    comment = angular.element(document.getElementById(commentId + version));
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

        $scope.goToParentComment = function (rootComment, parent) {

            if (!parent.id || !parent.hasOwnProperty('version')) {
                return
            }
            $scope.gotToComment(parent.id, parent.version)
        };

        $scope.doAddComment = function () {
            if ($scope.app.user.loggedIn) {
                $scope.app.scrollToAnchor('post_argument_wrap');
                $scope.focusArgumentSubject = true;
            } else {
                $scope.app.doShowLogin();
            }
        };
    }
    ]);
