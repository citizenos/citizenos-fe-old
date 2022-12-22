'use strict';
import * as angular from 'angular';

let topicSidepanel = {
    selector: 'topicSidepanel',
    templateUrl: '/views/components/topic/topic_sidepanel.html',
    bindings: {},
    controller:['AppService', '$log', 'Topic', 'sUpload', 'TopicAttachment', 'TopicAttachmentService', '$state', 'ngDialog', class TopicSidepanelController {
        public topic;
        public STATUSES = [];
        public ATTACHMENT_SOURCES = [];

        constructor (public app, $log, private Topic, private sUpload, TopicAttachment, private TopicAttachmentService, private $state, private ngDialog) {
            $log.debug('TopicSidepanelController');
            this.topic = app.topic;
            this.STATUSES = Topic.STATUSES;
            this.ATTACHMENT_SOURCES = TopicAttachment.SOURCES;
        }

        sendToVote () {
            return this.Topic.changeState(this.topic, 'vote');
        };

        sendToFollowUp (stateSuccess) {
            this.app.topicsSettings = false;
            return this.Topic.changeState(this.topic, 'followUp', stateSuccess);
        };

        closeTopic () {
            this.app.topicsSettings = false;
            return this.Topic.changeState(this.topic, 'closed');
        };

        downloadAttachment (attachment) {
            this.app.topicsSettings = false;
            return this.sUpload.download(this.topic.id, attachment.id, this.app.user.id);
        };

        duplicateTopic () {
            this.ngDialog
                .openConfirm({
                    template: '/views/modals/topic_duplicate_confirm.html',
                })
                .then(() => {
                    this.Topic
                        .duplicate(this.topic)
                        .then((duplicate) => {
                            this.$state.go('topics/view', {topicId: duplicate.id}, {reload:true});
                        });
                }, angular.noop);
        };

        openFeedback () {
            const dialog = this.ngDialog
                .open({
                    template: '<feedback></feedback>',
                    plain: true
                });
        };
    }]
};

angular
    .module('citizenos')
    .component(topicSidepanel.selector, topicSidepanel);
