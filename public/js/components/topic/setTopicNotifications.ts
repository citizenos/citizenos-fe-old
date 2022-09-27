'use strict';
import * as angular from 'angular';

let setTopicNotifications = {
    selector: 'setTopicNotifications',
    templateUrl: '/views/modals/set_topic_notifications.html',
    bindings: {
        topicId: '@'
    },
    controller: ['$state', '$stateParams', 'sTopic', 'sNotification', 'Topic', 'ngDialog', class SetTopicNotificationsController {
        private $state;
        private $stateParams;
        private sTopic;
        private sNotification;
        private ngDialog;
        private Topic
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

        constructor ($state, $stateParams, sTopic, sNotification, Topic, ngDialog) {
            this.$state = $state;
            this.$stateParams = $stateParams;
            this.sTopic = sTopic;
            this.sNotification = sNotification;
            this.Topic = Topic;
            this.ngDialog = ngDialog;
            if (this.supportedTabs.indexOf($stateParams.tab) > -1 ) {
                this.tabSelected = $stateParams.tab;
            }
            this.init()
        }

        init () {
            const self = this;
            new this.Topic({id: this.topicId})
                .$get()
                .then((topic) => {
                    self.topic = topic;
                    self.sTopic
                    .getTopicNotificationSettings(this.topicId).then((settings) => {
                        self.settings = angular.merge(self.settings, settings);
                    });
                });
        }
        toggleAllNotifications () {
            let toggle = true;
            const self = this;
            if (Object.values(this.settings.preferences).indexOf(false) === -1) {
                toggle = false;
            }
            Object.keys(this.settings.preferences).forEach((key) => {
                if (toggle) {
                    return self.settings.preferences[key] = true;
                }

                self.settings.preferences[key] = false;
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
            const self = this;
            if (!this.settings.allowNotifications) {
                this.sTopic.deleteTopicNotificationSettings(self.topicId);
            } else {
                this.sTopic.updateTopicNotificationSettings(self.topicId, this.settings)
                    .then((data) => {
                        self.settings = data;
                        if (self.$state.current.name === 'account.settings') {
                            self.$state.reload(true);
                        }
                    }, (err) => {
                        self.sNotification.addError(err);
                    });
            }
            this.ngDialog.closeAll();
        };

    }]
}
angular
    .module('citizenos')
    .component(setTopicNotifications.selector, setTopicNotifications);
