'use strict';
import * as angular from 'angular';

let topicSettings = {
    selector: 'topicSettings',
    templateUrl: '/views/modals/topic_settings.html',
    bindings: {},
    controller: ['$state', '$stateParams', '$log', '$timeout', '$anchorScroll', 'Topic', 'TopicVote', 'TopicMemberUser', 'ngDialog', 'AppService',  class TopicSettingsController {
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
        public searchString = null;
        public searchResults = {};
        public errors = null;

        public app;
        public topic;
        public topicId;

        private $state;
        private $timeout;
        private Topic;
        private TopicVote;
        private TopicMemberUser;
        private ngDialog;

        constructor ($state, $stateParams, $log, $timeout, $anchorScroll, Topic, TopicVote, TopicMemberUser, ngDialog, AppService) {
          //  super();
            $log.debug('TopicSettingsCtrl', $state, $stateParams);
            this.$state = $state;
            this.$timeout = $timeout;
            this.Topic = Topic;
            this.TopicVote = TopicVote;
            this.TopicMemberUser = TopicMemberUser;
            this.ngDialog = ngDialog;
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
                .then(function (topicVote) {
                    this.topic.vote = topicVote;
                    this.form.topic.vote = angular.copy(topicVote);
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

            return this.form.topic.vote.$update();
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
            this.form.topic.visibility = 'public';
            if (this.form.topic.visibility === true || this.form.topic.visibility === 'private') {
                this.form.topic.visibility = 'private';
            }

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
    }]
}
angular
    .module('citizenos')
    .component(topicSettings.selector, topicSettings);
