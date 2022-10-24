'use strict';
import * as angular from 'angular';
/* global window _*/

let topic = {
    selector: 'topic',
    templateUrl: '/views/topics_topicId.html',
    bindings: {},
    controller: ['$scope', '$state', '$stateParams', '$timeout', '$log', '$sce', 'ngDialog', 'sAuth', 'sUpload', 'Topic', 'TopicMemberUser', 'TopicAttachment', 'TopicCommentService', 'AppService', class TopicController {
        public topic;
        public app;
        public isTopicReported = false;
        public hideTopicContent = false;
        public showVoteCreateForm = false;
        public ATTACHMENT_SOURCES = [];

        public topicAttachments = [];
        public inlinecomments = [];

        public hashtagForm = {
            hashtag: null,
            errors: null,
            bytesLeft: 59
        };
        public showInfoEdit = false;

        public STATUSES = [];
        public VISIBILITY = [];

        constructor (private $scope, private $state, private $stateParams, $timeout, private $log, private $sce, private ngDialog, private sAuth, private sUpload, private Topic, private TopicMemberUser, private TopicAttachment, private TopicCommentService, AppService) {
            $log.debug('TopicController');
            console.log('TopicController', AppService.topic);
            this.app = AppService;
            this.topic = AppService.topic;
            if ($state.$current.name === 'topics/view' && this.topic.status === Topic.STATUSES.voting) {
                $timeout(() => {
                    let stateParams = Object.assign({}, $stateParams)
                    stateParams.voteId = this.topic.voteId;

                    return $state.go('topics/view/votes/view', stateParams);
                });
            }
            if ($state.$current.name === 'topics/view/votes/create') {
                this.showVoteCreateForm = !this.showVoteCreateForm;
            }
            this.ATTACHMENT_SOURCES = TopicAttachment.SOURCES;
            this.STATUSES = Topic.STATUSES;
            this.VISIBILITY = Topic.VISIBILITY;
            this.showInfoEdit = this.app.editMode;
            this.loadTopicAttachments();
            this.init()
        }

        doShowReportOverlay () {
            this.ngDialog.openConfirm({
                template: '/views/modals/topic_reports_reportId.html',
                data: this.$stateParams,
                scope: this,
                closeByEscape: false
            }).then(() => {
                this.hideTopicContent = false;
            },() => {
                    this.$state.go('home');
                }
            );
        };

        showVoteCreate () {
            this.showVoteCreateForm = !this.showVoteCreateForm;
        };

        hideInfoEdit () {
            this.showInfoEdit = false
        };

        loadTopicAttachments () {
            this.topicAttachments = this.TopicAttachment.query({topicId: this.topic.id});
        };

        doDeleteTopic () {
            this.$log.debug('doDeleteTopic');

            this.ngDialog
                .openConfirm({
                    template: '/views/modals/topic_delete_confirm.html'
                })
                .then(() => {
                    this.topic
                        .$delete()
                        .then(() => {
                            this.$state.go('my/topics', null, {reload: true});
                        });
                }, angular.noop);
        };

        doLeaveTopic () {
            this.ngDialog
                .openConfirm({
                    template: '/views/modals/topic_member_user_leave_confirm.html',
                    data: {
                        topic: this.topic
                    }
                }).then(() => {
                    const topicMemberUser = new this.TopicMemberUser({id: this.sAuth.user.id});
                    topicMemberUser
                        .$delete({topicId: this.topic.id})
                        .then(() => {
                            this.$state.go('my/topics', null, {reload: true});
                        });
                });
        };

        doSetTopicStatus (status) {
            if (status !== this.topic.status) {
                this.topic.status = status;
                this.topic.$update(() => {
                    this.topic = this.Topic.get({topicId: this.$stateParams.topicId});
                });
            }
        };

        togglePin () {
            if (!this.app.user.loggedIn) {
                return this.app.doShowLogin();
            }

            this.topic.togglePin().then(() => {
                if (this.$state.current.name.indexOf('my') > -1) {
                    this.$state.reload(true);
                }
            });
        };

        downloadAttachment (attachment) {
            return this.sUpload.download(this.topic.id, attachment.id, this.app.user.id);
        };

        getCommentData (commentId) {
            return this.inlinecomments[commentId];
        };

        handleTopicDescription () {
            this.app.metainfo.description = angular.element('<div/>').html(this.topic.description.replace(/<br>/gm, '\n')).text().replace(this.topic.title, '').trim(); // Strip HTML and title
            const docImageSrcMatch = this.topic.description.match(/<img src="(http[^"]*)/);
            const docImageSrc = docImageSrcMatch ? docImageSrcMatch[1] : null;
            if (docImageSrc) {
                this.app.metainfo.image = docImageSrc;
            }

            if (this.app.user.loggedIn && this.$state.current.name.indexOf('topics/view/votes/view') === 0) {
                var t = new this.Topic({id: this.topic.id});
                t
                    .$getInlineComments()
                    .then((inlinecomments) => {
                        this.inlinecomments = inlinecomments;
                    });
                // Little hack, while ep_comments exports deleted comments in html too
                this.topic.description = this.topic.description.replace(/data-comment="comment-deleted"/gi, '');

                this.topic.description = this.topic.description.replace(/data\-comment/gi, 'cos-inline-comment="getCommentData" data-comment');

            }
        };

        init () {
            if (this.topic.description) {
                this.handleTopicDescription()
            }

            // Topic has been moderated, we need to show User warning AND hide Topic content
            // As the controller is used both in /my/topics/:topicId and /topics/:topicId the dialog is directly opened
            if (this.isTopicReported) {
                // NOTE: Well.. all views that are under the topics/view/votes/view would trigger doble overlays which we don't want
                // Not nice, but I guess the problem starts with the 2 views using same controller. Ideally they should have a parent controller and extend that with their specific functionality
                if (this.$state.is('topics/view') || this.$state.is('my/topics/topicId')) {
                    this.doShowReportOverlay();
                }
            } else {
                this.hideTopicContent = false;
            }

            if (this.topic) {
                const padURL = new URL(this.topic.padUrl);
                if (padURL.searchParams.get('lang') !== this.app.language) {
                    padURL.searchParams.set('lang', this.app.language);
                }
                padURL.searchParams.set('theme', 'default');
                this.topic.padUrl = padURL.href; // Change of PAD URL here has to be before $sce.trustAsResourceUrl($scope.topic.padUrl);
                if (!this.topic.canEditDescription() && (this.$stateParams.editMode && this.$stateParams.editMode === 'true')) {
                    this.app.editMode = false;
                    const stateParams = Object.assign({}, this.$stateParams);
                    delete stateParams.editMode;
                    this.$state.transitionTo(this.$state.$current.name, stateParams, {
                        notify: false,
                        reload: false
                    });
                }
            }
            this.isTopicReported = this.topic.report && this.topic.report.moderatedReasonType;
            this.app.metainfo.title = this.topic.title;
            this.topic.padUrl = this.$sce.trustAsResourceUrl(this.topic.padUrl);
            this.topic.description = this.$sce.trustAsHtml(this.topic.description);
            this.app.editMode = (this.$stateParams.editMode && this.$stateParams.editMode === 'true') || false;

            if (this.$stateParams.notificationSettings) {
                this.app.doShowTopicNotificationSettings(this.topic.id);
            }

            this.$scope.$watch(() => {
                return this.$state.$current.name
            }, (newVal, oldVal) => {
                if (oldVal === 'topics/view/files') {
                    this.loadTopicAttachments();
                }
            });
        }
    }]
};

angular
    .module('citizenos')
    .component(topic.selector, topic);
