'use strict';
import * as angular from 'angular';

let topicSettings = {
    selector: 'topicSettings',
    templateUrl: '/views/modals/topic_settings.html',
    bindings: {},
    controller: ['$state', '$stateParams', '$log', '$timeout', '$translate', '$anchorScroll', 'Topic', 'TopicVote', 'TopicMemberUser', 'ngDialog', 'AppService',  class TopicSettingsController {
        public levels = {
            none: 0,
            read: 1,
            edit: 2,
            admin: 3
        };
        public form = {
            topic: null,
            description: null,
            urlJoin: null
        };
        public cosToggleTextOn = 'public';
        public topicList = {
            searchFilter: '',
            searchOrderBy: {
                property: 'title'
            }
        };
        public reminderOptions = [{value: 1, unit: 'days'}, {value: 2, unit: 'days'}, {value: 3, unit: 'days'}, {value: 1, unit: 'weeks'}, {value: 2, unit: 'weeks'}, {value: 1, unit: 'month'}];
        public searchString = null;
        public searchResults = {};
        public errors = null;

        public app;
        public topic;
        public topicId;

        constructor (private $state, $stateParams, $log, private $timeout, private $translate, $anchorScroll, private Topic, private TopicVote, private TopicMemberUser, private ngDialog, AppService) {
          //  super();
            $log.debug('TopicSettingsCtrl', $state, $stateParams);
            this.app = AppService;
            this.app.tabSelected = $stateParams.tab || 'settings';

            const urlParams = {
                topicId: $stateParams.topicId,
                include: 'vote',
                prefix: null,
                userId: null
            };
            if (AppService.user.loggedIn) {
                urlParams.prefix = 'users';
                urlParams.userId = 'self';
            }
            const self = this;
            Topic.get(urlParams).$promise
                .then((topic) => {
                    $anchorScroll('content_root'); // TODO: Remove when the 2 columns become separate scroll areas
                    console.log(topic);
                    console.log(self);
                    self.topic = topic;
                    self.init();
                });
        }

        init () {
            // Create a copy of parent scopes Topic, so that while modifying we don't change parent state
            this.form = {
                topic: null,
                description: null,
                urlJoin: null
            };
            this.form.topic = angular.copy(this.topic);

            if (this.topic.status === this.Topic.STATUSES.voting && this.topic.voteId) {
                new this.TopicVote({
                    topicId: this.topic.id,
                    id: this.topic.voteId
                })
                .$get()
                .then((topicVote) => {
                    this.topic.vote = topicVote;
                    this.form.topic.vote = angular.copy(topicVote);
                    if (topicVote.reminderTime && !topicVote.reminderSent) {
                        this.form.topic.vote.reminder = true;
                    }
                });
            }

            this.form.description = angular.element(this.topic.description).text().replace(this.topic.title, '');

            this.searchString = null;
            this.searchResults = {};
            this.errors = null;

        };

        checkHashtag () {
            let length = 0;
            const str = this.form.topic.hashtag;
            const hashtagMaxLength = 59;

            if (str) {
                length = str.length;
                for (let i = 0; i < str.length; i++) {
                    const code = str.charCodeAt(i);
                    if (code > 0x7f && code <= 0x7ff) length++;
                    else if (code > 0x7ff && code <= 0xffff) length += 2;
                    if (code >= 0xDC00 && code <= 0xDFFF) i++; //trail surrogate
                }
            }

            if ((hashtagMaxLength - length) < 0) {
                this.errors = {hashtag: 'MSG_ERROR_40000_TOPIC_HASHTAG'};
            } else if (this.errors && this.errors.hashtag) {
                this.errors.hashtag = null;
            }
        };

        doDeleteHashtag () {
            this.form.topic.hashtag = null;
        };

        doEditVoteDeadline () {
            this.form.topic.vote.topicId = this.topic.id;
            if (!this.form.topic.vote.reminder && !this.form.topic.vote.reminderSent) {
                this.form.topic.vote.reminderTime = null;
            }
            return this.form.topic.vote
                .$update()
                .then((voteValue) => {
                    if (voteValue.reminderTime && !voteValue.reminderSent) {
                        this.form.topic.vote.reminder = true;
                    } else {
                        this.form.topic.vote.reminder = false;
                    }
                });
        };

        addTopicCategory (category) {
            if (this.form.topic.categories.indexOf(category) === -1 && this.form.topic.categories.length < this.Topic.CATEGORIES_COUNT_MAX) {
                this.form.topic.categories.push(category);
            }
        };

        removeTopicCategory (category) {
            this.form.topic.categories.splice(this.form.topic.categories.indexOf(category), 1);
        };

        doOrderTopics (property) {
            if (this.topicList.searchOrderBy.property == property) {
                property = '-' + property;
            }
            this.topicList.searchOrderBy.property = property;
        };

        doSaveTopic () {
            const self = this;
            this.errors = null;

            if (this.form.topic.endsAt && this.topic.endsAt === this.form.topic.endsAt) { //Remove endsAt field so that topics with endsAt value set could be updated if endsAt is not changed
                delete this.form.topic.endsAt;
            }
            this.form.topic
                .$update()
                .then(() => {
                    self.$timeout(() => { // Avoid $digest already in progress
                        const dialogs = self.ngDialog.getOpenDialogs();
                        self.ngDialog.close(dialogs[0], '$closeButton');
                        self.$state.go(self.$state.current.parent, {topicId: self.topic.id}, {reload: true});
                    });
                },
                (errorResponse) => {
                    if (errorResponse.data && errorResponse.data.errors) {
                        self.errors = errorResponse.data.errors;
                    }
                }
            );
        };

        doLeaveTopic () {
            const self = this;
            this.ngDialog
                .openConfirm({
                    template: '/views/modals/topic_member_user_leave_confirm.html',
                    data: {
                        topic: this.topic
                    }
                })
                .then(() => {
                    const topicMemberUser = new self.TopicMemberUser({id: self.app.user.id});
                    topicMemberUser
                        .$delete({topicId: self.topic.id})
                        .then(() => {
                            self.$state.go('my/topics', null, {reload: true});
                        });
                });
        };

        doDeleteTopic () {
            const self = this;
            this.ngDialog
                .openConfirm({
                    template: '/views/modals/topic_delete_confirm.html'
                })
                .then(() => {
                    self.topic
                        .$delete()
                        .then(() => {
                            self.$state.go('my/topics', null, {reload: true});
                        });
                }, angular.noop);
        };

        isVisibleReminderOption (time) {
            let timeItem = new Date(this.topic.vote.endsAt);
            switch (time.unit) {
                case 'weeks':
                    timeItem.setDate(timeItem.getDate() - (time.value * 7));
                    break;
                case 'month':
                    timeItem.setMonth(timeItem.getMonth() - time.value);
                    break
                default:
                    timeItem.setDate(timeItem.getDate() - time.value);
            }
            if (timeItem > new Date()) return true;

            return false;
        };

        selectedReminderOption () {
            let voteDeadline = new Date(this.topic.vote.endsAt);
            let reminder = new Date(this.form.topic.vote.reminderTime);
            let diffTime = voteDeadline.getTime() - reminder.getTime();
            const days = Math.ceil(diffTime / (1000 * 3600 * 24));
            const weeks = Math.ceil(diffTime / (1000 * 3600 * 24 * 7));
            const months = (voteDeadline.getMonth() - reminder.getMonth() +
                12 * (voteDeadline.getFullYear() - reminder.getFullYear()));
            const item = this.reminderOptions.find((item) => {
                if ( item.value === days && item.unit === 'days') return item;
                else if ( item.value === weeks && item.unit === 'weeks') return item;
                else if ( item.value === months && item.unit === 'month') return item;
            });
            if (item) {
                return this.$translate.instant('OPTION_' + item.value + '_'+ item.unit.toUpperCase());
            }
        };

        setVoteReminder (time) {
            let reminderTime = new Date(this.topic.vote.endsAt);
            switch (time.unit) {
                case 'weeks':
                    reminderTime.setDate(reminderTime.getDate() - (time.value * 7));
                    break;
                case 'month':
                    reminderTime.setMonth(reminderTime.getMonth() - time.value);
                    break
                default:
                    reminderTime.setDate(reminderTime.getDate() - time.value);
            }
            this.form.topic.vote.reminderTime = reminderTime;
            this.doEditVoteDeadline();
        };
    }]
}
angular
    .module('citizenos')
    .component(topicSettings.selector, topicSettings);
