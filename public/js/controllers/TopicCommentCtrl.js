'use strict';

angular
    .module('citizenos')
    .controller('TopicCommentCtrl', ['$scope', '$state', '$stateParams', '$timeout', '$log', '$translate', '$q', 'ngDialog', 'sLocation', 'TopicComment', function ($scope, $state, $stateParams, $timeout, $log, $translate, $q, ngDialog, sLocation, TopicComment) {
        $log.debug('TopicCommentCtrl', $scope, $scope.topic, $stateParams.topicId);

        $scope.topic = $scope.topic || {id: $stateParams.topicId};

        var COMMENT_VERSION_SEPARATOR = '_v';
        var COMMENT_COUNT_PER_PAGE = 10;

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

        /**
         * Parse commentId value from the state params to commentId and version
         *
         *  @param {string} commentIdWithVersion Comment id in format {commentId}_v{version}
         *
         * @returns {{commentVersion: null, commentId: null}|{commentVersion: (*|string), commentId: (*|string)}}
         * @private
         */
        var _parseCommentIdAndVersion = function (commentIdWithVersion) {
            if (!commentIdWithVersion) {
                return {
                    commentId: null,
                    commentVersion: null
                }
            }

            var commentIdAndVersionRegex = new RegExp('^([a-fA-F0-9]{8}-[a-fA-F0-9]{4}-4{1}[a-fA-F0-9]{3}-[89abAB]{1}[a-fA-F0-9]{3}-[a-fA-F0-9]{12})+' + COMMENT_VERSION_SEPARATOR + '([0-9]+)$'); // SRC: https://gist.github.com/bugventure/f71337e3927c34132b9a#gistcomment-2238943
            var commentIdWithVersionSplit = $stateParams.commentId.match(commentIdAndVersionRegex);

            if (!commentIdWithVersionSplit) {
                $log.error('Invalid input for _parseCommentIdAndVersion. Provided commentId does not look like UUIDv4 with version appended', commentIdWithVersion);
                return {
                    commentId: null,
                    commentVersion: null
                }
            }

            return {
                commentId: commentIdWithVersionSplit[1],
                commentVersion: parseInt(commentIdWithVersionSplit[2]),
            }
        };

        $scope.getCommentIdWithVersion = function (commentId, version) {
            return commentId + COMMENT_VERSION_SEPARATOR + version;
        };

        $scope.COMMENT_TYPES = TopicComment.COMMENT_TYPES;

        $scope.loadTopicComments = function (offset, limit) {
            if (!limit) {
                limit = COMMENT_COUNT_PER_PAGE;
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
                    if (!comments || !comments.length) {
                        return comments;
                    }

                    // Direct referencing a comment, we have no idea on what page it may be. Let's try to find out if it's on the current page.
                    var commentIdInParams = _parseCommentIdAndVersion($stateParams.commentId).commentId;

                    if (commentIdInParams && JSON.stringify(comments).indexOf(commentIdInParams) === -1) { // Comment ID is specified in the params, its not in the result set... on another page?
                        $scope.topicComments.page += 1;
                        $scope.loadPage($scope.topicComments.page, true);
                        return $q.reject();
                    } else {
                        return comments;
                    }
                })
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

                        if ($scope.topic) { // For the arguments count on the /topics/:topicId, not beautiful. Will do until /topics/:topicId API returns comments count.
                            $scope.topic.comments = $scope.topicComments;
                        }

                        $scope.topicComments.rows = comments;

                        if (_parseCommentIdAndVersion($stateParams.commentId).commentId) {
                            $timeout(function () {
                                $scope.goToComment($stateParams.commentId);
                            });
                        }
                    } else {
                        if ($stateParams.commentId) { // Comment ID was provided in params, but we could not find a matching comment on any of the pages, so the best we can do is to go and load first page
                            return $state.go(
                                $state.current.name,
                                {
                                    argumentsPage: 1,
                                    commentId: null
                                },
                                {
                                    location: 'replace'
                                }
                            );
                        } else {
                            $scope.topicComments.rows = [];
                            $scope.topicComments.count = {
                                pro: 0,
                                con: 0,
                                total: 0
                            };
                        }
                    }
                });
        };

        /**
         * Comment pagination
         *
         * @param {Number} [page=1] Page number
         * @param {Boolean} [dontResetCommentIdParam=false] Do not reset the commentId param. Defaults to resetting commentId param
         */
        $scope.loadPage = function (page, dontResetCommentIdParam) {
            var offset = (page - 1) * COMMENT_COUNT_PER_PAGE;
            if (!dontResetCommentIdParam) {
                $stateParams.commentId = null;
            }
            $scope.loadTopicComments(offset, COMMENT_COUNT_PER_PAGE);
        };

        var init = function () {
            var commentIdInParams = _parseCommentIdAndVersion($stateParams.commentId).commentId;
            if (commentIdInParams) {
                $stateParams.argumentsPage = 1; // Override the set page number as comment may be on any page by now
            }

            $scope.loadPage($stateParams.argumentsPage, true);
        };
        init();


        $scope.orderComments = function (order) {
            $scope.topicComments.orderBy = order;
            $scope.topicComments.orderByTranslation = $translate.instant('VIEWS.TOPICS_TOPICID.TXT_ARGUMENT_ORDER_BY_' + order.toUpperCase());
            $stateParams.commentId = null; // Reset commentId, does not make sense in ordering scenario
            $scope.loadTopicComments();
        };

        $scope.doCommentVote = function (comment, value) {
            if (!$scope.app.user.loggedIn) {
                return;
            }

            var topicComment = new TopicComment({
                id: comment.id,
                topicId: $scope.topic.id
            });
            topicComment.value = value;
            topicComment
                .$vote()
                .then(function (voteResult) {
                    comment.votes = voteResult;
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

        $scope.updateComment = function (comment, editType) {
            if (comment.editType !== comment.type || comment.subject !== comment.editSubject || comment.text !== comment.editText) {
                comment.subject = comment.editSubject;
                comment.text = comment.editText;

                if (editType) {
                    comment.type = editType;
                }
                comment.topicId = $scope.topic.id;

                comment
                    .$update()
                    .then(function (commentUpdated) {
                        return $state.go(
                            $state.current.name,
                            {
                                commentId: $scope.getCommentIdWithVersion(commentUpdated.id, commentUpdated.edits.length)
                            }
                        );
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
            $log.debug('TopicCommentCtrl.doShowDeleteComment()', comment);

            ngDialog
                .openConfirm({
                    template: '/views/modals/topic_delete_comment.html',
                    data: {
                        comment: comment
                    }
                })
                .then(function () {
                    comment.topicId = $scope.topic.id;
                    comment
                        .$delete()
                        .then(function () {
                            return $state.go(
                                $state.current.name,
                                {
                                    commentId: $scope.getCommentIdWithVersion(comment.id, comment.edits.length - 1)
                                },
                                {
                                    reload: true
                                }
                            );
                        }, angular.noop);
                });
        };

        $scope.doShowDeleteReply = function (comment) {
            $log.debug('TopicCommentCtrl.doShowDeleteReply()', comment);

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
                            return $state.go(
                                $state.current.name,
                                {
                                    commentId: $scope.getCommentIdWithVersion(comment.id, comment.edits.length - 1)
                                },
                                {
                                    reload: true
                                }
                            );
                        }, angular.noop);
                });
        };

        /**
         * Show the referenced comment on the screen
         *
         * @param {String} commentIdWithVersion Comment id with version in format {{uuidv4}}+_v+{{version}}. For example: 604670eb-27b4-48d0-b19b-b6cf6bde33b2_v0
         * @param {Object} [$event] Event handler
         */
        $scope.goToComment = function (commentIdWithVersion, $event) {
            if ($event) {
                $event.preventDefault();

                $state // Update the URL in browser for history and copy
                    .go($state.current.name, {commentId: commentIdWithVersion}, {
                        notify: false,
                        inherit: true
                    });
            }

            if (!commentIdWithVersion || commentIdWithVersion.indexOf(COMMENT_VERSION_SEPARATOR) < 0) {
                $log.error('Invalid input for $scope.goToComment. Expecting UUIDv4 comment ID with version. For example: "604670eb-27b4-48d0-b19b-b6cf6bde33b2_v0"', commentIdWithVersion);
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

                var commentParameterValues = _parseCommentIdAndVersion(commentIdWithVersion);
                var commentId = commentParameterValues.commentId;
                var commentVersion = commentParameterValues.commentVersion || 0;

                if (!commentId) {
                    $log.error('$scope.goToComment', 'No commentId and/or version provided, nothing to do here', commentIdWithVersion);
                    return;
                }

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

                                // Expand edits only if an actual edit is referenced.
                                var replyEdits = $scope.topicComments.rows[i].replies.rows[j].edits;
                                if (replyEdits.length && commentVersion <= replyEdits.length - 1) {
                                    $scope.topicComments.rows[i].replies.rows[j].showEdits = true; // In case the reply has edits and that is referenced.
                                }
                                $timeout(function () { // TODO:  After "showEdits" is set, angular will render the edits and that takes time. Any better way to detect of it to be done?
                                    $scope.app.scrollToAnchor(commentIdWithVersion)
                                        .then(function () {
                                            var commentElement = angular.element(document.getElementById(commentIdWithVersion));
                                            commentElement.addClass('highlight');
                                            $state.commentId = commentIdWithVersion;
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

        $scope.getCommentUrl = function (commentIdWithVersion) {
            return sLocation.getAbsoluteUrl('/', null, {commentId: commentIdWithVersion});
        };

        $scope.goToParentComment = function (rootComment, parent, $event) {
            if ($event) { // Enables us to use links where link is generated with ui-sref and can be copied, but action is ng-click or similar without reloading page
                $event.preventDefault(); //
            }

            if (!parent.id || !parent.hasOwnProperty('version')) {
                return;
            }

            var commentIdWithVersion = $scope.getCommentIdWithVersion(parent.id, parent.version);

            return $state // Update the URL in browser for history and copy
                .go($state.current.name, {commentId: commentIdWithVersion}, {
                    notify: false,
                    inherit: true
                })
                .then(function () {
                    return $scope.goToComment(commentIdWithVersion);
                });
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
