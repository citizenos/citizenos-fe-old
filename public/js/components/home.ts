'use strict';
import * as angular from 'angular';
import * as $ from 'jquery';

let home = {
    selector: 'home',
    templateUrl: '/views/home.html',
    bindings: {},
    controller: ['$log', '$location', '$window','$state', '$stateParams', 'PublicTopicService', 'Topic', 'AppService', class HomeController {
        private FILTERS_ALL = 'all';

        private topicList = [];
        private topicCountTotal = null;
        private isTopicListLoading = null; // Bool, but for initial load using null.

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

        constructor (private $log, private $location, private $window, private $state, private $stateParams, private PublicTopicService, private Topic, private app) {
            $log.info('HomeCtrl', $state, $stateParams);
            this.init();
            this.PublicTopicService.reload();
            if (this.$stateParams.category && !this.Topic.CATEGORIES[this.$stateParams.category]) {
                return this.$state.go('error/404');
            }
            if (this.isTopicListLoading === true) {
                return this.$log.warn('HomeCtrl.loadTopicList()', 'Topic list already loading, will skip this request.');
            }

            if (this.topicCountTotal && this.topicList.length >= this.topicCountTotal) {
                return this.$log.warn('HomeCtrl.loadTopicList()', 'Maximum count of topics already loaded! Skipping API call.');
            }
        };

        resolveCategory () {
            let category;
            if (this.$state.current.name === 'category') {
                category = this.$stateParams.category;
            } else if (this.Topic.CATEGORIES[this.$state.current.name]) {
                category = this.$state.current.name; //Check if special page for category
            }

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

            this.$stateParams.topicStatus = status;
            this.$state.go(this.$state.current.name, this.$stateParams);
        };

        doSetCategory (category) {
            if (category === this.FILTERS_ALL) {
                category = null;
                this.$stateParams.category = category;
                this.$state.go('home', this.$stateParams);
            } else {
                this.$stateParams.category = category;
                this.$state.go('category', this.$stateParams);
            }
        };

            /**
             * Clear all applied filters
             */
        doClearFilters () {
            this.$state.transitionTo('home', {language: this.$stateParams.language}, {reload: false});
        };

        isFilterApplied () {
            return this.filters.categories.value !== this.FILTERS_ALL || this.filters.statuses.value !== this.FILTERS_ALL;
        };

        isTutorialVisible () {
            return this.filters.categories.value === this.FILTERS_ALL
                && this.filters.statuses.value === this.FILTERS_ALL
                && this.topicList.length; // Render tutorial only when there are topics, this avoids Android and alignment issues.
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

    }]
};

angular
    .module('citizenos')
    .component(home.selector, home);