'use strict';
import * as angular from 'angular';

let topicSettings = {
    selector: 'topicSettings',
    templateUrl: '/views/components/topic/topic_settings.html',
    bindings: {},
    controller: ['$state', '$stateParams', '$log', '$timeout', '$translate', '$anchorScroll', 'Topic', 'Group', 'TopicVote', 'TopicMemberUser', 'TopicMemberGroupService', 'ngDialog', 'AppService', class TopicSettingsController {
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
        public reminderOptions = [{ value: 1, unit: 'days' }, { value: 2, unit: 'days' }, { value: 3, unit: 'days' }, { value: 1, unit: 'weeks' }, { value: 2, unit: 'weeks' }, { value: 1, unit: 'month' }];
        public searchString = null;
        public searchResults = {};
        public errors = null;

        public topic;
        public topicId;

        constructor(private $state, private $stateParams, $log, private $timeout, private $translate, private $anchorScroll, private Topic, private Group, private TopicVote, private TopicMemberUser, private TopicMemberGroupService, private ngDialog, private app) {
            $log.debug('TopicSettingsCtrl', $state, $stateParams);
            this.app.tabSelected = $stateParams.tab || 'settings';
            TopicMemberGroupService.topicId = $stateParams.topicId;
            TopicMemberGroupService.reload();

            this.loadTopic();
            this.doEditVoteDeadline = angular.bind(this, this.doEditVoteDeadline);
        }

        loadTopic() {
            const urlParams = {
                include: 'vote',
                prefix: null,
                userId: null
            };
            if (this.app.user.loggedIn) {
                urlParams.prefix = 'users';
                urlParams.userId = 'self';
            }
            this.Topic.get(this.$stateParams.topicId, urlParams)
                .then((topic) => {
                    this.$anchorScroll('content_root'); // TODO: Remove when the 2 columns become separate scroll area
                    this.app.topic = topic;
                    this.topic = topic;
                    this.init();
                });
        }

        init() {
            // Create a copy of parent scopes Topic, so that while modifying we don't change parent state
            this.form = {
                topic: null,
                description: null,
                urlJoin: null
            };
            this.form.topic = angular.copy(this.topic);

            if (this.topic.status === this.Topic.STATUSES.voting && this.topic.voteId) {
                this.TopicVote
                    .get({
                        topicId: this.topic.id,
                        id: this.topic.voteId
                    })
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

        checkHashtag() {
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
                this.errors = { hashtag: 'MSG_ERROR_40000_TOPIC_HASHTAG' };
            } else if (this.errors && this.errors.hashtag) {
                this.errors.hashtag = null;
            }
        };

        doDeleteHashtag() {
            this.form.topic.hashtag = null;
        };

        doEditVoteDeadline() {
            this.form.topic.vote.topicId = this.topic.id;
            if (!this.form.topic.vote.reminder && !this.form.topic.vote.reminderSent) {
                this.form.topic.vote.reminderTime = null;
            }
            return this.TopicVote
                .update(this.form.topic.vote)
                .then((voteValue) => {
                    if (voteValue.reminderTime && !voteValue.reminderSent) {
                        this.form.topic.vote.reminder = true;
                    } else {
                        this.form.topic.vote.reminder = false;
                    }
                });
        };

        addTopicCategory(category) {
            if (this.form.topic.categories.indexOf(category) === -1 && this.form.topic.categories.length < this.Topic.CATEGORIES_COUNT_MAX) {
                this.form.topic.categories.push(category);
            }
        };

        removeTopicCategory(category) {
            this.form.topic.categories.splice(this.form.topic.categories.indexOf(category), 1);
        };

        doOrderTopics(property) {
            if (this.topicList.searchOrderBy.property == property) {
                property = '-' + property;
            }
            this.topicList.searchOrderBy.property = property;
        };

        doSaveTopic() {
            this.errors = null;

            if (this.form.topic.endsAt && this.topic.endsAt === this.form.topic.endsAt) { //Remove endsAt field so that topics with endsAt value set could be updated if endsAt is not changed
                delete this.form.topic.endsAt;
            }
            this.Topic
                .update(this.form.topic)
                .then(() => {
                    this.loadTopic();
                    const dialogs = this.ngDialog.getOpenDialogs();
                    this.ngDialog.close(dialogs[0], '$closeButton');
                    this.$state.go('^', null, { reload: true });
                }, (errorResponse) => {
                    if (errorResponse.data && errorResponse.data.errors) {
                        this.errors = errorResponse.data.errors;
                    }
                }
                );
        };

        doLeaveTopic() {
            this.ngDialog
                .openConfirm({
                    template: '/views/modals/topic_member_user_leave_confirm.html',
                    data: {
                        topic: this.topic
                    }
                })
                .then(() => {
                    this.TopicMemberUser
                        .delete({ id: this.app.user.id, topicId: this.topic.id })
                        .then(() => {
                            this.$state.go('my/topics', null, { reload: true });
                        });
                });
        };

        doDeleteTopic() {
            this.ngDialog
                .openConfirm({
                    template: '/views/modals/topic_delete_confirm.html'
                })
                .then(() => {
                    console.log(this.$state.href('my/topics'));

                    return this.Topic
                        .delete(this.topic)
                        .then((res) => {
                            location.href = this.$state.href('my/topics');
                        });
                }, (err) => {
                    console.log(err);
                });
        };

        isVisibleReminderOption(time) {
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

        selectedReminderOption() {
            let voteDeadline = new Date(this.topic.vote.endsAt);
            let reminder = new Date(this.form.topic.vote.reminderTime);
            let diffTime = voteDeadline.getTime() - reminder.getTime();
            const days = Math.ceil(diffTime / (1000 * 3600 * 24));
            const weeks = Math.ceil(diffTime / (1000 * 3600 * 24 * 7));
            const months = (voteDeadline.getMonth() - reminder.getMonth() +
                12 * (voteDeadline.getFullYear() - reminder.getFullYear()));
            const item = this.reminderOptions.find((item) => {
                if (item.value === days && item.unit === 'days') return item;
                else if (item.value === weeks && item.unit === 'weeks') return item;
                else if (item.value === months && item.unit === 'month') return item;
            });
            if (item) {
                return this.$translate.instant('OPTION_' + item.value + '_' + item.unit.toUpperCase());
            }
        };

        setVoteReminder(time) {
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

        canChangeVisibility() {
            const publicGroups = this.TopicMemberGroupService.groups.filter((group) => group.visibility === this.Group.VISIBILITY.public);
            return (this.Topic.canDelete(this.topic) && (this.topic.visibility === this.Topic.VISIBILITY.private || publicGroups.length === 0));
        }
    }]
}
angular
    .module('citizenos')
    .component(topicSettings.selector, topicSettings);
