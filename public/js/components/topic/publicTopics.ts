'use strict';
import * as angular from 'angular';
import * as $ from 'jquery';

let publicTopics = {
    selector: 'publicTopics',
    templateUrl: '/views/components/topic/public_topics.html',
    bindings: {},
    controller: ['$scope', '$window','$state', '$stateParams', 'PublicTopicService', 'Topic', 'AppService', class PublicTopicsController {
        private FILTERS_ALL = 'all';

        private filters = {
            categories: {
                value: null,
                options: []
            },
            statuses: {
                value: null,
                options: []
            },
            tabSelected: 'categories' // Mobile view has tabs where the filters are selected, indicates which filter tab is visible
        };

        constructor ($scope, private $window, private $state, private $stateParams, private PublicTopicService, private Topic, public app) {
            this.init();
            if (this.$stateParams.category && !this.Topic.CATEGORIES[this.$stateParams.category]) {
                return this.$state.go('error/404');
            }
            PublicTopicService.limit = 26;
            $scope.$watch(() => PublicTopicService.isLoading, (newValue, oldValue) => {
                if (newValue === false &&  PublicTopicService.statuses !== $stateParams.topicStatus && $stateParams.topicStatus !== 'moderated') {
                    let status = $stateParams.topicStatus;
                    if (status === this.FILTERS_ALL) {
                        status = null;
                    }
                    if (status === 'moderated') {
                        this.PublicTopicService.statuses = null;
                        this.PublicTopicService.showModerated = true;
                    } else {
                        this.PublicTopicService.statuses = status;
                        this.PublicTopicService.showModerated = false;
                    }
                    PublicTopicService.reload();
                }
            });
        };

        resolveCategory () {
            let category;
            if (this.$state.current.name === 'public/topics') {
                category = this.FILTERS_ALL;
            }
            if (this.$state.current.name === 'category') {
                category = this.$stateParams.category;
            } else if (this.Topic.CATEGORIES[this.$state.current.name]) {
                category = this.$state.current.name; //Check if special page for category
            }

            this.PublicTopicService.categories = this.Topic.CATEGORIES[category] ? category : null;
            this.PublicTopicService.reload();
            return this.Topic.CATEGORIES[category] ? category : this.FILTERS_ALL;
        };

        init () {
            this.filters.categories.value = this.resolveCategory();
            this.filters.statuses.value = this.FILTERS_ALL;
            this.filters.categories.options = [this.FILTERS_ALL].concat(Object.values(this.Topic.CATEGORIES));
            this.filters.statuses.options = [this.FILTERS_ALL].concat(Object.values(this.Topic.STATUSES)).concat('moderated');

            let status = this.resolveStatus();
            let showModerated = false;
            if (status === 'moderated' ) {
                status = null;
                showModerated = true;
            }
        };

        doSetStatus (status) {
            this.filters.statuses.value = status;

            if (status === this.FILTERS_ALL) {
                status = null;
            }
            if (status === 'moderated') {
                this.PublicTopicService.statuses = null;
                this.PublicTopicService.showModerated = true;
            } else {
                this.PublicTopicService.statuses = status;
                this.PublicTopicService.showModerated = false;
            }
            this.PublicTopicService.reload();
            this.$stateParams.topicStatus = status;
            this.$state.go(this.$state.current.name, this.$stateParams);
        };

        doSetCategory (category) {
            if (category === this.FILTERS_ALL) {
                this.PublicTopicService.categories = category = null;
                this.PublicTopicService.reload();
                this.$stateParams.category = category;
                this.$state.go('public/topics', this.$stateParams);
            } else {
                this.PublicTopicService.categories = category;
                this.PublicTopicService.reload();
                this.$stateParams.category = category;
                this.$state.go('category', this.$stateParams);
            }
        };

            /**
             * Clear all applied filters
             */
        doClearFilters () {
            this.$state.transitionTo('public/topics', {language: this.$stateParams.language}, {reload: false});
        };

        isFilterApplied () {
            return this.filters.categories.value !== this.FILTERS_ALL || this.filters.statuses.value !== this.FILTERS_ALL;
        };

        isTutorialVisible () {
            return this.filters.categories.value === this.FILTERS_ALL
                && this.filters.statuses.value === this.FILTERS_ALL
                && this.PublicTopicService.topics.length; // Render tutorial only when there are topics, this avoids Android and alignment issues.
        };

        resolveStatus () {
            if (this.$stateParams.topicStatus === this.FILTERS_ALL) {
                this.filters.statuses.value = this.FILTERS_ALL;
                this.$stateParams.topicStatus = null;
                return null;
            }
            let status = (this.$stateParams.topicStatus && this.filters.statuses.options.indexOf(this.$stateParams.topicStatus) > -1) ? this.$stateParams.topicStatus: null;
            if (status) {
                this.filters.statuses.value = status;
            } else {
                this.$stateParams.topicStatus = null;
                this.$state.go(this.$state.current.name, this.$stateParams);
            }

            return status;
        };

        goToView(topic) {
            const params = {
                language: this.$stateParams.language,
                topicId: topic.id
            }
            let view = 'topics/view';
            if (topic.status === this.Topic.STATUSES.voting) {
                view += '/votes/view'
                params['voteId'] = topic.voteId;
            } else if ([this.Topic.STATUSES.followUp, this.Topic.STATUSES.close].indexOf(topic.status) > -1) {
                view += '/followUp';
            }

            this.$state.go(view, params);
        }

        goToPage (url) {
            this.$window.location.href = url;
        }

        createNewTopic() {
            if (!this.app.user.loggedIn) {
                return this.app.doShowLogin();
            }

            this.$state.go('topics/create');
        }
    }]
};

angular
    .module('citizenos')
    .component(publicTopics.selector, publicTopics);
