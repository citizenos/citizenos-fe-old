'use strict'

import * as angular from 'angular';

let topicComments = {
    selector: 'topicComments',
    templateUrl: '/views/components/topic/topics_topicId_comments.html',
    bindings: {
        comment: '='
    },
    controller: ['$scope', '$state', '$stateParams', '$timeout', '$log', '$translate', '$document', 'ngDialog', 'sLocation', 'sNotification', 'TopicComment', 'TopicCommentService', 'AppService', class TopicCommentsController {
        private COMMENT_VERSION_SEPARATOR = '_v';
        public COMMENT_TYPES;
        public topic;
        public topicId;
        public focusArgumentSubject = false;

        public topicComments = {
            orderBy: null,
            orderByOptions: null
        };
        constructor ($scope, private $state, private $stateParams, private $timeout, private $log, private $translate, private $document, private ngDialog, private sLocation, private sNotification, private TopicComment, public TopicCommentService, private app) {
            this.topicId = $stateParams.topicId;
            this.topicComments = angular.extend(this.topicComments, {
                orderBy: TopicComment.COMMENT_ORDER_BY.date,
                orderByOptions: TopicComment.COMMENT_ORDER_BY
            });

            Object.keys(this.topicComments.orderByOptions).forEach((option) => {
                const translation = $translate.instant('VIEWS.TOPICS_TOPICID.TXT_ARGUMENT_ORDER_BY_' + option.toUpperCase());
                this.topicComments.orderByOptions[option] = {
                    value: option,
                    translation: translation
                };
            });
            TopicCommentService.topicId = $stateParams.topicId;
            TopicCommentService.loadPage(parseInt($stateParams.argumentsPage) || 1);
            this.COMMENT_TYPES = TopicComment.COMMENT_TYPES;
            const commentIdInParams = this._parseCommentIdAndVersion($stateParams.commentId).commentId;
            if (commentIdInParams) {
                this.TopicCommentService.page=1;
                $scope.$watch(() => TopicCommentService.isLoading, (newVal, oldVal) => {
                    if (newVal === false && commentIdInParams && JSON.stringify(TopicCommentService.comments).indexOf(commentIdInParams) === -1) {
                        this.TopicCommentService.loadPage(this.TopicCommentService.page+1);
                    } else {
                        this.goToComment(this.$stateParams.commentId, null);
                    }
                });
            }
        }

        private _parseCommentIdAndVersion (commentIdWithVersion) {
            if (!commentIdWithVersion) {
                return {
                    commentId: null,
                    commentVersion: null
                }
            }
            if (commentIdWithVersion.length === 36) {
                commentIdWithVersion = commentIdWithVersion + this.COMMENT_VERSION_SEPARATOR + '0';
            }
            const commentIdAndVersionRegex = new RegExp('^([a-fA-F0-9]{8}-[a-fA-F0-9]{4}-4{1}[a-fA-F0-9]{3}-[89abAB]{1}[a-fA-F0-9]{3}-[a-fA-F0-9]{12})' + this.COMMENT_VERSION_SEPARATOR + '([0-9]+)$'); // SRC: https://gist.github.com/bugventure/f71337e3927c34132b9a#gistcomment-2238943
            const commentIdWithVersionSplit = commentIdWithVersion.match(commentIdAndVersionRegex);

            if (!commentIdWithVersionSplit) {
                this.$log.error('Invalid input for _parseCommentIdAndVersion. Provided commentId does not look like UUIDv4 with version appended', commentIdWithVersion);
                return {
                    commentId: null,
                    commentVersion: null
                }
            }

            return {
                commentIdWithVersion: commentIdWithVersion,
                commentId: commentIdWithVersionSplit[1],
                commentVersion: parseInt(commentIdWithVersionSplit[2]),
            }
        };

        loadPage (page) {
            this.TopicCommentService.loadPage(page);
            const params = Object.assign({}, this.$stateParams);
            if (this.$stateParams.commentId) {
                delete params.commentId;
            }
            params.argumentsPage = page;
            this.$state.transitionTo(this.$state.current.name, params, {
                notify: false,
                reload: false,
                location: location
            });
        }

        getCommentIdWithVersion (commentId, version) {
            return commentId + this.COMMENT_VERSION_SEPARATOR + version;
        };

        doCommentVote (comment, value) {
            if (!this.app.user.loggedIn) {
                return;
            }

            const topicComment = {
                commentId: comment.id,
                topicId: this.topicId,
                value: value
            };

            this.TopicComment
                .vote(topicComment)
                .then((voteResult) => {
                    comment.votes = voteResult;
                });
        };

        doShowVotersList (comment) {
            this.ngDialog
                .open({
                    template: `<topic-comment-reactions topic-id="${this.topicId}" comment-id="${comment.id}"></topic-comment-reactions>`,
                    plain:true
                });
        };

        doCommentReport (comment) {
            this.ngDialog
                .open({
                    template: '<topic-comment-report comment-id="'+comment.id+'"></topic-comment-report>',
                    plain: true
                });
        };

        commentEditMode (comment) {
            comment.editSubject = comment.subject;
            comment.editText = comment.text;
            comment.editType = comment.type;
            if (comment.showEdit) { // Visible, so we gonna hide, need to clear form errors
                delete comment.errors;
            }
            comment.showEdit = !comment.showEdit;
        };

        getParentAuthor (rootComment, parentId) {
            if (parentId === rootComment.id) {
                return rootComment.creator.name;
            }
            for (let i = 0; i < rootComment.replies.rows.length; i++) {
                if (rootComment.replies.rows[i].id === parentId) {
                    return rootComment.replies.rows[i].creator.name;
                }
            }
        };

        doShowDeleteComment (comment) {
            this.$log.debug('TopicCommentCtrl.doShowDeleteComment()', comment);

            this.ngDialog
                .openConfirm({
                    template: '/views/modals/topic_delete_comment.html',
                    data: {
                        comment: comment
                    }
                })
                .then(() => {
                    comment.topicId = this.topicId;
                    this.TopicComment
                        .delete(comment)
                        .then(() => {
                            return this.$state.go(
                                this.$state.current.name,
                                {
                                    commentId: this.getCommentIdWithVersion(comment.id, comment.edits.length - 1)
                                },
                                {
                                    reload: true
                                }
                            );
                        }, angular.noop);
                });
        };

        doShowDeleteReply (comment) {
            this.$log.debug('TopicCommentCtrl.doShowDeleteReply()', comment);

            this.ngDialog
                .openConfirm({
                    template: '/views/modals/topic_delete_reply.html',
                    data: {
                        comment: comment
                    }
                })
                .then(() => {
                    comment.topicId = this.topicId;
                    this.TopicComment.delete(comment)
                        .then(() => {
                            return this.$state.go(
                                this.$state.current.name,
                                {
                                    commentId: this.getCommentIdWithVersion(comment.id, comment.edits.length - 1)
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
        goToComment (commentIdWithVersion, $event) {
            if ($event) {
                $event.preventDefault();

                this.$state // Update the URL in browser for history and copy
                    .go(this.$state.current.name, {commentId: commentIdWithVersion}, {
                        notify: false,
                        inherit: true
                    });
            }

            if (!commentIdWithVersion || commentIdWithVersion.indexOf(this.COMMENT_VERSION_SEPARATOR) < 0) {
                this.$log.error('Invalid input for this.goToComment. Expecting UUIDv4 comment ID with version. For example: "604670eb-27b4-48d0-b19b-b6cf6bde33b2_v0"', commentIdWithVersion);
                return;
            }

            const commentElement = angular.element(this.$document[0].getElementById(commentIdWithVersion));

            // The referenced comment was found on the page displayed
            if (commentElement.length) {
                this.app.scrollToAnchor(commentIdWithVersion)
                    .then(() => {
                        commentElement.addClass('highlight');
                        this.$timeout(() => {
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

                const commentParameterValues = this._parseCommentIdAndVersion(commentIdWithVersion);
                const commentId = commentParameterValues.commentId;
                const commentVersion = commentParameterValues.commentVersion || 0;

                if (!commentId) {
                    return this.$log.error('this.goToComment', 'No commentId and/or version provided, nothing to do here', commentIdWithVersion);
                }

                for (let i = 0; i < this.TopicCommentService.comments.length; i++) {
                    // 1. the commentId + version refers to another version of the comment and the comments are not expanded.
                    if (this.TopicCommentService.comments[i].id === commentId) {
                        this.TopicCommentService.comments[i].showEdits = true;
                        this.$timeout(() => { // TODO:  After "showEdits" is set, angular will render the edits and that takes time. Any better way to detect of it to be done?
                            this.app.scrollToAnchor(commentIdWithVersion)
                                .then(() => {
                                    const commentElement = angular.element(this.$document[0].getElementById(commentIdWithVersion));
                                    commentElement.addClass('highlight');
                                    return this.$timeout(() => {
                                        commentElement.removeClass('highlight');
                                    }, 500);
                                });
                        }, 100);
                        break;
                    } else { // 2. the commentId + version refers to a comment reply, but replies have not been expanded.
                        for (let j = 0; j < this.TopicCommentService.comments[i].replies.rows.length; j++) {
                            if (this.TopicCommentService.comments[i].replies.rows[j].id === commentId) {
                                this.TopicCommentService.comments[i].showReplies = true;

                                // Expand edits only if an actual edit is referenced.
                                const replyEdits = this.TopicCommentService.comments[i].replies.rows[j].edits;
                                if (replyEdits.length && commentVersion !== replyEdits.length -1) {
                                    this.TopicCommentService.comments[i].replies.rows[j].showEdits = true; // In case the reply has edits and that is referenced.
                                }
                                this.$timeout(() => { // TODO:  After "showEdits" is set, angular will render the edits and that takes time. Any better way to detect of it to be done?
                                    this.app.scrollToAnchor(commentIdWithVersion)
                                        .then(() => {
                                            const commentElement = angular.element(this.$document[0].getElementById(commentIdWithVersion));
                                            commentElement.addClass('highlight');
                                            this.$state.commentId = commentIdWithVersion;
                                            this.$timeout(() => {
                                                commentElement.removeClass('highlight');
                                            }, 500);
                                        });
                                }, 100);

                                // Break the outer loop when the inner reply loop finishes as there is no more work to do.
                                i = this.TopicCommentService.comments.length;

                                break;
                            }
                        }
                    }
                }
            }
        };

        getCommentUrl (commentIdWithVersion) {
            return this.sLocation.getAbsoluteUrl('/topics/:topicId', {topicId: this.topicId}, {commentId: commentIdWithVersion});
        };

        copyCommentLink (mainid, version, event) {
            const id = mainid + '_v' + (version);
            const urlInputElement = this.$document[0].getElementById('comment_link_input_' + id) as HTMLInputElement || null;
            const url = this.getCommentUrl(id);
            urlInputElement.value = url;
            urlInputElement.focus();
            urlInputElement.select();
            urlInputElement.setSelectionRange(0, 99999);
            this.$document[0].execCommand('copy');

            var X = event.pageX;
            var Y = event.pageY;

            this.sNotification.inline(this.$translate.instant('VIEWS.TOPICS_TOPICID.ARGUMENT_LNK_COPIED'), X, Y - 35);
        };

        goToParentComment (rootComment, parent, $event) {
            if ($event) { // Enables us to use links where link is generated with ui-sref and can be copied, but action is ng-click or similar without reloading page
                $event.preventDefault(); //
            }

            if (!parent.id || !parent.hasOwnProperty('version')) {
                return;
            }

            const commentIdWithVersion = this.getCommentIdWithVersion(parent.id, parent.version);
            return this.$state // Update the URL in browser for history and copy
                .go(this.$state.current.name, {commentId: commentIdWithVersion}, {
                    notify: false,
                    inherit: true
                })
                .then(() => {
                    return this.goToComment(commentIdWithVersion, null);
                });
        };

        doAddComment () {
            if (this.app.user.loggedIn) {
                this.app.scrollToAnchor('post_argument_wrap');
                this.focusArgumentSubject = true;
            } else {
                this.app.doShowLogin();
            }
        };
    }]
}

angular
    .module('citizenos')
    .component(topicComments.selector, topicComments);
