'use strict';
import * as angular from 'angular';

let setTopicNotifications = {
    selector: 'setTopicNotifications',
    templateUrl: '/views/modals/set_topic_notifications.html',
    bindings: {
        topicId: '@'
    },
    controller: ['$state', '$stateParams', 'sTopic', 'sNotification', 'Topic', 'ngDialog', class SetTopicNotificationsController {
        public topicId;
        public topic;
        private supportedTabs = ['general'];
        public tabSelected = 'general';

        public settings = {
            topicId: null,
            preferences: {
                Topic: false,
                TopicComment: false,
                CommentVote: false,
                TopicReport: false,
                TopicVoteList: false,
                TopicEvent: false
            },
            allowNotifications: false
        };

        constructor (private $state, $stateParams, private sTopic, private sNotification, private Topic, private ngDialog) {
            if (this.supportedTabs.indexOf($stateParams.tab) > -1 ) {
                this.tabSelected = $stateParams.tab;
            }
            this.init()
        }

        init () {
            new this.Topic({id: this.topicId})
                .$get()
                .then((topic) => {
                    this.topic = topic;
                    this.sTopic
                    .getTopicNotificationSettings(this.topicId).then((settings) => {
                        this.settings = angular.merge(this.settings, settings);
                    });
                });
        }
        toggleAllNotifications () {
            let toggle = true;
            if (Object.values(this.settings.preferences).indexOf(false) === -1) {
                toggle = false;
            }
            Object.keys(this.settings.preferences).forEach((key) => {
                if (toggle) {
                    return this.settings.preferences[key] = true;
                }

                this.settings.preferences[key] = false;
            });
            if (toggle) {
                this.settings.allowNotifications = true;
            }
        };

        allChecked () {
            return (Object.values(this.settings.preferences).indexOf(false) === -1)
        };

        selectOption (option) {
            this.settings.preferences[option] = !this.settings.preferences[option];
            if (this.settings.preferences[option] === true) {
                this.settings.allowNotifications = true;
            }
        };

        doSaveSettings () {
            if (!this.settings.allowNotifications) {
                this.sTopic.deleteTopicNotificationSettings(this.topicId);
            } else {
                this.sTopic.updateTopicNotificationSettings(this.topicId, this.settings)
                    .then((data) => {
                        this.settings = data;
                        if (this.$state.current.name === 'account.settings') {
                            this.$state.reload(true);
                        }
                    }, (err) => {
                        this.sNotification.addError(err);
                    });
            }
            this.ngDialog.closeAll();
        };

    }]
}
angular
    .module('citizenos')
    .component(setTopicNotifications.selector, setTopicNotifications);
