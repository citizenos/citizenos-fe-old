'use strict';
import * as angular from 'angular';

let topicMilestones = {
    selector: 'topicMilestones',
    templateUrl: '/views/components/topic_milestones.html',
    bindings: {},
    controller:['AppService', '$log', '$state', '$stateParams', 'TopicEvent', 'Topic', 'ngDialog', class TopicMilestoneController {
        public app;
        public topic;
        public eventForm = {
            subject: null,
            text: null,
            errors: null
        };

        public topicEvents = null;
        public maxLengthSubject = 128;
        public maxLengthText = 2048;

        constructor (AppService, $log, $state, $stateParams, private TopicEvent, Topic,  private ngDialog) {
            $log.debug('TopicFollowUpCtrl');
            this.app = AppService;
            this.topic = AppService.topic;
            if ([Topic.STATUSES.closed, Topic.STATUSES.followUp].indexOf(this.topic.status) > -1) {
                this.init();
                return;
            }
            $state.go('topics/view', {
                language: $stateParams.language,
                topicId: this.topic.id
            }); //if topic editing or voting is still in progress
        };

        init () {
            this.topicEvents = this.TopicEvent.query({topicId: this.topic.id});

        };

        submitEvent () {
            const topicEvent = new this.TopicEvent({topicId: this.topic.id, subject: this.eventForm.subject, text: this.eventForm.text});

            topicEvent
                .$save()
                .then(() => {
                    this.init();
                },(res) => {
                    this.eventForm.errors = res.data.errors;
                });
        };

        deleteEvent (event) {
            this.ngDialog
                .openConfirm({
                    template: '/views/modals/topic_event_delete_confirm.html',
                    data: {
                        event: event
                    }
                })
                .then(() => {
                    event.topicId = this.topic.id;
                    event
                        .$delete()
                        .then(function () {
                            this.init();
                        });
                }, angular.noop);

        }
    }]
};

angular
.module('citizenos')
.component(topicMilestones.selector, topicMilestones);