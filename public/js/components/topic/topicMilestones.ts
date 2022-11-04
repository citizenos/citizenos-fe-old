'use strict';
import * as angular from 'angular';

let topicMilestones = {
    selector: 'topicMilestones',
    templateUrl: '/views/components/topic/topic_milestones.html',
    bindings: {},
    controller:['AppService', '$log', '$state', '$stateParams', 'TopicEvent', 'Topic', 'ngDialog', class TopicMilestoneController {
        public topic;
        public eventForm = {
            subject: null,
            text: null,
            errors: null
        };

        public topicEvents = null;
        public maxLengthSubject = 128;
        public maxLengthText = 2048;

        constructor (private app, $log, $state, $stateParams, private TopicEvent, private Topic,  private ngDialog) {
            $log.debug('TopicFollowUpCtrl');
            this.topic = app.topic;
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
            this.eventForm = {
                subject: null,
                text: null,
                errors: null
            };
            this.TopicEvent.query({topicId: this.topic.id})
                .then((events) => {
                    this.topicEvents = events.rows;
                })

        };

        submitEvent () {
            this.TopicEvent
                .save({topicId: this.topic.id, subject: this.eventForm.subject, text: this.eventForm.text})
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
                    this.TopicEvent
                        .delete(event)
                        .then(() => {
                            this.init();
                        });
                }, angular.noop);

        }
    }]
};

angular
.module('citizenos')
.component(topicMilestones.selector, topicMilestones);
