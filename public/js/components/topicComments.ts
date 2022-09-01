'use strict'

import * as angular from 'angular';

let topicComments = {
    selector: 'topicComments',
    templateUrl: '../../views/topics_topicId_comments.html',
    bindings: {
        topicId: '='
    },
    controller: ['$state', '$stateParams', '$timeout', '$log', '$translate', '$q', '$document', 'ngDialog', 'sLocation', 'sNotification', 'TopicComment', 'AppService', class TopicCommentsController {
        private $log;
        private $state;
        private $stateParams;
        private $timeout;
        private $translate;
        private $q;
        private $document;
        private ngDialog;
        private sLocation;
        private sNotification;
        private TopicComment;

        private COMMENT_VERSION_SEPARATOR = '_v';
        private COMMENT_COUNT_PER_PAGE = 10;
        public COMMENT_TYPES;
        public topic;
        public topicId;
        public app;
        public focusArgumentSubject = false;

        public topicComments = {
            rows: [],
            count: {
                pro: 0,
                con: 0,
                poi: 0,
                total: 0,
                reply: 0
            },
            page: 1,
            totalPages: 0,
            orderBy: null,
            orderByTranslation: null,
            orderByOptions: null
        };
        constructor ($state, $stateParams, $timeout, $log, $translate, $q, $document, ngDialog, sLocation, sNotification, TopicComment, AppService) {
            this.$state = $state;
            this.$stateParams = $stateParams;
            this.$timeout = $timeout;
            this.$log = $log;
            this.$translate = $translate;
            this.$q = $q;
            this.$document = $document;
            this.ngDialog = ngDialog;
            this.sLocation = sLocation;
            this.sNotification = sNotification;
            this.TopicComment = TopicComment;
            this.app = AppService;
            this.topicComments = angular.extend(this.topicComments, {
                orderBy: TopicComment.COMMENT_ORDER_BY.date,
                orderByTranslation: $translate.instant('VIEWS.TOPICS_TOPICID.TXT_ARGUMENT_ORDER_BY_DATE'),
                orderByOptions: TopicComment.COMMENT_ORDER_BY
            });

            Object.keys(this.topicComments.orderByOptions).forEach((option) => {
                const translation = $translate.instant('VIEWS.TOPICS_TOPICID.TXT_ARGUMENT_ORDER_BY_' + option.toUpperCase());
                this.topicComments.orderByOptions[option] = {
                    value: option,
                    translation: translation
                };
            });

            this.COMMENT_TYPES = TopicComment.COMMENT_TYPES;
            this.init();
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


        getCommentIdWithVersion (commentId, version) {
            return commentId + this.COMMENT_VERSION_SEPARATOR + version;
        };



        loadTopicComments (offset?, limit?) {
            const self = this;
            if (!limit) {
                limit = self.COMMENT_COUNT_PER_PAGE;
            }
            if (!offset) {
                offset = 0;
            }
            if (!self.topicId) {
                self.topicId = self.$stateParams.topicId;
            }

            self.TopicComment
                .query({
                    topicId: self.topicId,
                    orderBy: self.topicComments.orderBy,
                    offset: offset,
                    limit: limit
                })
                .$promise
                .then((comments) => {
                    if (!comments || !comments.length) {
                        return comments;
                    }

                    // Direct referencing a comment, we have no idea on what page it may be. Let's try to find out if it's on the current page.
                    const commentIdInParams = self._parseCommentIdAndVersion(self.$stateParams.commentId).commentId;

                    if (commentIdInParams && JSON.stringify(comments).indexOf(commentIdInParams) === -1) { // Comment ID is specified in the params, its not in the result set... on another page?
                        self.topicComments.page += 1;
                        self.loadPage(self.topicComments.page, true);
                        return self.$q.reject();
                    } else {
                        return comments;
                    }
                })
                .then((comments) => {
                    // NOTE: TopicComment.query internally transforms the API response argument (comment) tree to 2 levels - bring all replies and their replies to same level.
                    // Now we got only 2 levels in the tree - arguments and replies.
                    if (comments && comments.length) {
                        self.topicComments.count = comments[0].count;
                        self.topicComments.totalPages = Math.ceil((self.topicComments.count.total - self.topicComments.count.reply)  / limit);
                        self.topicComments.page = Math.ceil((offset + limit) / limit);

                        self.$stateParams.argumentsPage = self.topicComments.page;
                        const location = (self.$stateParams.argumentsPage === 1) ? 'replace' : true; // Replace location only on the first load, so that back navigation would work. When direct linking or navigating pages, dont replace.

                        self.$state.transitionTo(self.$state.current.name, self.$stateParams, {
                            notify: false,
                            reload: false,
                            location: location
                        });

                        if (self.topic) { // For the arguments count on the /topics/:topicId, not beautiful. Will do until /topics/:topicId API returns comments count.
                            self.topic.comments = self.topicComments;
                        }

                        self.topicComments.rows = comments;

                        const parsedResult = self._parseCommentIdAndVersion(self.$stateParams.commentId);
                        if (parsedResult.commentId) {
                            self.$timeout(() => {
                                self.goToComment(parsedResult.commentIdWithVersion, null);
                            });
                        }
                    } else {
                        if (self.$stateParams.commentId) { // Comment ID was provided in params, but we could not find a matching comment on any of the pages, so the best we can do is to go and load first page
                            return self.$state.go(
                                self.$state.current.name,
                                {
                                    argumentsPage: 1,
                                    commentId: null
                                },
                                {
                                    location: 'replace'
                                }
                            );
                        } else {
                            self.topicComments.rows = [];
                            self.topicComments.count = {
                                pro: 0,
                                con: 0,
                                poi: 0,
                                total: 0,
                                reply: 0
                            };
                        }
                    }
                });
        };

        loadPage (page, dontResetCommentIdParam) {
            const offset = (page - 1) * this.COMMENT_COUNT_PER_PAGE;
            if (!dontResetCommentIdParam) {
                this.$stateParams.commentId = null;
            }
            this.loadTopicComments(offset, this.COMMENT_COUNT_PER_PAGE);
        };

        init () {
            if (this.$stateParams.commentId) {
                const commentIdInParams = this._parseCommentIdAndVersion(this.$stateParams.commentId).commentId;
                if (commentIdInParams) {
                    this.$stateParams.argumentsPage = 1; // Override the set page number as comment may be on any page by now
                }
            }

            this.loadPage(this.$stateParams.argumentsPage, true);
        };

        orderComment (order) {
            this.topicComments.orderBy = order;
            this.topicComments.orderByTranslation = this.$translate.instant('VIEWS.TOPICS_TOPICID.TXT_ARGUMENT_ORDER_BY_' + order.toUpperCase());
            this.$stateParams.commentId = null; // Reset commentId, does not make sense in ordering scenario
            this.loadTopicComments();
        };

        doCommentVote (comment, value) {
            if (!this.app.user.loggedIn) {
                return;
            }

            const topicComment = new this.TopicComment({
                id: comment.id,
                topicId: this.topicId
            });
            topicComment.value = value;
            topicComment
                .$vote()
                .then((voteResult) => {
                    comment.votes = voteResult;
                });
        };

        doShowVotersList (comment) {
            const self = this;
            const topicComment = new this.TopicComment({
                id: comment.id,
                topicId: this.topicId
            });
            topicComment
                .$votes()
                .then((commentVotes) => {
                    self.ngDialog
                        .open({
                            template: '/views/modals/topic_comment_reactions.html',
                            data: {
                                commentVotes: commentVotes,
                                topic: self.topic
                            }
                        });
                });
        };

        doCommentReport (comment) {
            this.ngDialog
                .open({
                    template: '/views/modals/topic_comment_report.html',
                    data: {
                        comment: comment,
                        topic: {
                            id: this.topicId
                        }
                    }
                });
        };

        updateComment (comment) {
            const self = this;
            if (comment.editType !== comment.type || comment.subject !== comment.editSubject || comment.text !== comment.editText) {
                comment.subject = comment.editSubject;
                comment.text = comment.editText;
                comment.type = comment.editType;
                comment.topicId = this.topicId;

                comment
                    .$update()
                    .then((commentUpdated) => {
                        delete comment.errors;
                        return self.$state.go(
                            self.$state.current.name,
                            {
                                commentId: self.getCommentIdWithVersion(commentUpdated.id, commentUpdated.edits.length)
                            }
                        );
                    }, (err) => {
                        self.$log.error('Failed to update comment', comment, err);
                        comment.errors = err.data.errors;
                    });
            } else {
                this.commentEditMode(comment);
            }
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
            const self = this;
            self.$log.debug('TopicCommentCtrl.doShowDeleteComment()', comment);

            self.ngDialog
                .openConfirm({
                    template: '/views/modals/topic_delete_comment.html',
                    data: {
                        comment: comment
                    }
                })
                .then(() => {
                    comment.topicId = self.topicId;
                    comment
                        .$delete()
                        .then(() => {
                            return self.$state.go(
                                self.$state.current.name,
                                {
                                    commentId: self.getCommentIdWithVersion(comment.id, comment.edits.length - 1)
                                },
                                {
                                    reload: true
                                }
                            );
                        }, angular.noop);
                });
        };

        doShowDeleteReply (comment) {
            const self = this;
            self.$log.debug('TopicCommentCtrl.doShowDeleteReply()', comment);

            self.ngDialog
                .openConfirm({
                    template: '/views/modals/topic_delete_reply.html',
                    data: {
                        comment: comment
                    }
                })
                .then(() => {
                    comment.topicId = self.topicId;
                    comment.$delete()
                        .then(() => {
                            return self.$state.go(
                                self.$state.current.name,
                                {
                                    commentId: self.getCommentIdWithVersion(comment.id, comment.edits.length - 1)
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
            const self = this;
            if ($event) {
                $event.preventDefault();

                self.$state // Update the URL in browser for history and copy
                    .go(self.$state.current.name, {commentId: commentIdWithVersion}, {
                        notify: false,
                        inherit: true
                    });
            }

            if (!commentIdWithVersion || commentIdWithVersion.indexOf(self.COMMENT_VERSION_SEPARATOR) < 0) {
                self.$log.error('Invalid input for this.goToComment. Expecting UUIDv4 comment ID with version. For example: "604670eb-27b4-48d0-b19b-b6cf6bde33b2_v0"', commentIdWithVersion);
                return;
            }

            const commentElement = angular.element(self.$document[0].getElementById(commentIdWithVersion));

            // The referenced comment was found on the page displayed
            if (commentElement.length) {
                self.app.scrollToAnchor(commentIdWithVersion)
                    .then(() => {
                        commentElement.addClass('highlight');
                        self.$timeout(() => {
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

                const commentParameterValues = self._parseCommentIdAndVersion(commentIdWithVersion);
                const commentId = commentParameterValues.commentId;
                const commentVersion = commentParameterValues.commentVersion || 0;

                if (!commentId) {
                    return self.$log.error('this.goToComment', 'No commentId and/or version provided, nothing to do here', commentIdWithVersion);
                }

                for (let i = 0; i < this.topicComments.rows.length; i++) {
                    // 1. the commentId + version refers to another version of the comment and the comments are not expanded.
                    if (self.topicComments.rows[i].id === commentId) {
                        self.topicComments.rows[i].showEdits = true;
                        self.$timeout(() => { // TODO:  After "showEdits" is set, angular will render the edits and that takes time. Any better way to detect of it to be done?
                            self.app.scrollToAnchor(commentIdWithVersion)
                                .then(() => {
                                    const commentElement = angular.element(self.$document[0].getElementById(commentIdWithVersion));
                                    commentElement.addClass('highlight');
                                    return self.$timeout(() => {
                                        commentElement.removeClass('highlight');
                                    }, 500);
                                });
                        }, 100);
                        break;
                    } else { // 2. the commentId + version refers to a comment reply, but replies have not been expanded.
                        for (let j = 0; j < self.topicComments.rows[i].replies.rows.length; j++) {
                            if (self.topicComments.rows[i].replies.rows[j].id === commentId) {
                                self.topicComments.rows[i].showReplies = true;

                                // Expand edits only if an actual edit is referenced.
                                const replyEdits = self.topicComments.rows[i].replies.rows[j].edits;
                                if (replyEdits.length && commentVersion !== replyEdits.length -1) {
                                    self.topicComments.rows[i].replies.rows[j].showEdits = true; // In case the reply has edits and that is referenced.
                                }
                                self.$timeout(() => { // TODO:  After "showEdits" is set, angular will render the edits and that takes time. Any better way to detect of it to be done?
                                    this.app.scrollToAnchor(commentIdWithVersion)
                                        .then(() => {
                                            const commentElement = angular.element(self.$document[0].getElementById(commentIdWithVersion));
                                            commentElement.addClass('highlight');
                                            self.$state.commentId = commentIdWithVersion;
                                            self.$timeout(() => {
                                                commentElement.removeClass('highlight');
                                            }, 500);
                                        });
                                }, 100);

                                // Break the outer loop when the inner reply loop finishes as there is no more work to do.
                                i = this.topicComments.rows.length;

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
