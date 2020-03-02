'use strict';

angular
    .module('citizenos')
    .controller('TopicCommentCtrl', ['$scope', '$state', '$stateParams', '$timeout', '$log', '$translate', 'ngDialog', 'TopicComment', function ($scope, $state, $stateParams, $timeout, $log, $translate, ngDialog, TopicComment) {
        $log.debug('TopicCommentCtrl', $scope, $scope.topic, $stateParams.topicId);

        $scope.topic = $scope.topic || {id: $stateParams.topicId};

        var COMMENT_VERSION_SEPARATOR = '_v';
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
            $scope.topicComments.orderByOptions[option] = {
                value: option,
                translation: translation
            };
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
                    // NOTE: TopicComment.query internally transforms the API response argument (comment) tree to 2 levels - bring all replies and their replies to same level.
                    // Now we got only 2 levels in the tree - arguments and replies.
                    if (comments && comments.length) {
                        $scope.topicComments.count = comments[0].count;
                        $scope.topicComments.totalPages = Math.ceil($scope.topicComments.count.total / limit);
                        $scope.topicComments.page = Math.ceil((offset + limit) / limit);

                        $stateParams.argumentsPage = $scope.topicComments.page;
                        var location = ($stateParams.argumentsPage === 1) ? 'replace' : true; // Replace location only on the first load, so that back navigation would work. When direct linking or navigating pages, dont replace.

                        $state.transitionTo($state.current.name, $stateParams, {
                            notify: false,
                            reload: false,
                            location: location
                        });

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
                            $scope.goToComment($stateParams.commentId);
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
            topicComment
                .$vote()
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

            ngDialog
                .openConfirm({
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

            ngDialog
                .openConfirm({
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

        /**
         * Show the referenced comment on the screen
         *
         * @param {String} commentIdWithVersion Comment id with version in format {{uuidv4}}+_v+{{version}}. For example: 604670eb-27b4-48d0-b19b-b6cf6bde33b2_v0
         */
        $scope.goToComment = function (commentIdWithVersion) {
            if (!commentIdWithVersion || commentIdWithVersion.indexOf(COMMENT_VERSION_SEPARATOR) < 0) {
                console.error('Invalid input for $scope.goToComment. Expecting UUIDv4 comment ID with version. For example: "604670eb-27b4-48d0-b19b-b6cf6bde33b2_v0"', commentIdWithVersion);
                return;
            }

            var commentElement = angular.element(document.getElementById(commentIdWithVersion));

            // The referenced comment was found on the page displayed
            if (commentElement.length) {
                $scope.app.scrollToAnchor(commentIdWithVersion)
                    .then(function () {
                        commentElement.addClass('highlight');
                        $timeout(function () {
                            commentElement.removeClass('highlight');
                        }, 500);
                    });
            } else {
                // The referenced comment was NOT found on the page displayed.
                // That means either:
                // 1. the commentId + version refers to another version of the comment and the comments are not expanded.
                // 2. the commentId + version refers to a comment reply, but replies have not been expanded.
                // 3. the commentId + version is on another page
                // 4. the comment/reply does not exist
                var commentIdAndVersionRegex = new RegExp('^([a-fA-F0-9]{8}-[a-fA-F0-9]{4}-4{1}[a-fA-F0-9]{3}-[89abAB]{1}[a-fA-F0-9]{3}-[a-fA-F0-9]{12})+' + COMMENT_VERSION_SEPARATOR + '([0-9]+)$'); // SRC: https://gist.github.com/bugventure/f71337e3927c34132b9a#gistcomment-2238943
                var commentIdWithVersionSplit = commentIdWithVersion.match(commentIdAndVersionRegex);

                if (!commentIdWithVersionSplit) {
                    console.error('Invalid input for $scope.goToComment. Provided commentId does not look like UUIDv4 with version appended', commentIdWithVersion);
                    return;
                }

                var commentId = commentIdWithVersionSplit[1];
                var commentVersion = parseInt(commentIdWithVersionSplit[2]);

                for (var i = 0; i < $scope.topicComments.rows.length; i++) {
                    // 1. the commentId + version refers to another version of the comment and the comments are not expanded.
                    if ($scope.topicComments.rows[i].id === commentId) {
                        $scope.topicComments.rows[i].showEdits = true;
                        $timeout(function () { // TODO:  After "showEdits" is set, angular will render the edits and that takes time. Any better way to detect of it to be done?
                            $scope.app.scrollToAnchor(commentIdWithVersion)
                                .then(function () {
                                    var commentElement = angular.element(document.getElementById(commentIdWithVersion));
                                    commentElement.addClass('highlight');
                                    return $timeout(function () {
                                        commentElement.removeClass('highlight');
                                    }, 500);
                                });
                        }, 100);
                        break;
                    } else { // 2. the commentId + version refers to a comment reply, but replies have not been expanded.
                        for (var j = 0; j < $scope.topicComments.rows[i].replies.rows.length; j++) {
                            if ($scope.topicComments.rows[i].replies.rows[j].id === commentId) {
                                $scope.topicComments.rows[i].showReplies = true;
                                // TODO: Expand edits only if an edit is actually referenced.
                                $scope.topicComments.rows[i].replies.rows[j].showEdits = true; // In case the reply has edits and that is referenced.

                                $timeout(function () { // TODO:  After "showEdits" is set, angular will render the edits and that takes time. Any better way to detect of it to be done?
                                    $scope.app.scrollToAnchor(commentIdWithVersion)
                                        .then(function () {
                                            var commentElement = angular.element(document.getElementById(commentIdWithVersion));
                                            commentElement.addClass('highlight');
                                            $timeout(function () {
                                                commentElement.removeClass('highlight');
                                            }, 500);
                                        });
                                }, 100);

                                // Break the outer loop when the inner reply loop finishes as there is no more work to do.
                                i = $scope.topicComments.rows.length;

                                break;
                            }
                        }
                    }
                }
            }
        };

        $scope.goToParentComment = function (rootComment, parent) {

            if (!parent.id || !parent.hasOwnProperty('version')) {
                return;
            }
            $scope.goToComment(parent.id + COMMENT_VERSION_SEPARATOR + parent.version);
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
