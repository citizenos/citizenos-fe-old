'use strict';
import * as angular from 'angular';

let setTopicNotifications = {
    selector: 'setTopicNotifications',
    templateUrl: '/views/components/topic/set_topic_notifications.html',
    bindings: {
        topicId: '@'
    },
    controller: ['$scope', '$state', '$stateParams', 'TopicNotification', 'sNotification', 'Topic', 'ngDialog', class SetTopicNotificationsController {
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

        constructor ($scope, private $state, $stateParams, private TopicNotification, private sNotification, private Topic, private ngDialog) {
            if (this.supportedTabs.indexOf($stateParams.tab) > -1 ) {
                this.tabSelected = $stateParams.tab;
            }
            $scope.$watch(() => this.topicId, (newValue) => {
                if (newValue) {
                    Topic
                        .get(this.topicId)
                        .then((topic) => {
                            this.topic = topic;
                            TopicNotification
                                .get(this.topic).then((settings) => {
                                    this.settings = angular.merge(this.settings, settings);
                                });
                        });
                }
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
                this.TopicNotification.delete({topicId: this.topicId});
            } else {
                const settings = this.settings;
                settings.topicId = this.topicId;
                this.TopicNotification.update(settings)
                    .then((data) => {
                        this.settings = data;
                        if (this.$state.current.name === 'account/settings') {
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
