'use strict';
import * as angular from 'angular';
import * as $ from 'jquery';

let home = {
    selector: 'home',
    templateUrl: '/views/home.html',
    bindings: {},
    controller: class HomeController {
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
            limit: 30,
            offset: 0,
            tabSelected: 'categories' // Mobile view has tabs where the filters are selected, indicates which filter tab is visible
        };
        private app;

        constructor (private $log, private $location, private $window, private $state, private $stateParams, private sTopic, private AppService) {
            $log.info('HomeCtrl', $state, $stateParams);
            this.init();
            this.loadTopicList();
            this.app = AppService;
        };

        resolveCategory () {
            let category;
            if (this.$state.current.name === 'category') {
                category = this.$stateParams.category;
            } else if (this.sTopic.CATEGORIES[this.$state.current.name]) {
                category = this.$state.current.name; //Check if special page for category
            }

            return this.sTopic.CATEGORIES[category] ? category : this.FILTERS_ALL;
        };

        init () {
            this.filters.categories.value = this.resolveCategory();
            this.filters.statuses.value = this.FILTERS_ALL;
            this.filters.categories.options = [this.FILTERS_ALL].concat(Object.values(this.sTopic.CATEGORIES));
            this.filters.statuses.options = [this.FILTERS_ALL].concat(Object.values(this.sTopic.STATUSES)).concat('moderated');
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

        loadTopicList () {
            this.$log.debug('HomeCtrl.loadTopicList()');
            if (this.$stateParams.category && !this.sTopic.CATEGORIES[this.$stateParams.category]) {
                return this.$state.go('error/404');
            }
            if (this.isTopicListLoading === true) {
                return this.$log.warn('HomeCtrl.loadTopicList()', 'Topic list already loading, will skip this request.');
            }

            if (this.topicCountTotal && this.topicList.length >= this.topicCountTotal) {
                return this.$log.warn('HomeCtrl.loadTopicList()', 'Maximum count of topics already loaded! Skipping API call.');
            }

            this.isTopicListLoading = true;

            let status = this.resolveStatus();
            console.log(status);
            let showModerated = false;
            if (status === 'moderated' ) {
                status = null;
                showModerated = true;
            }
            this.sTopic
                .listUnauth(
                    this.filters.statuses.value !== this.FILTERS_ALL ? status : null,
                    this.filters.categories.value !== this.FILTERS_ALL ? this.resolveCategory() : null,
                    showModerated,
                    this.filters.offset,
                    this.filters.limit
                ).then((res) => {
                    this.topicList = this.topicList.concat(res.data.data.rows);
                    this.topicCountTotal = res.data.data.countTotal;

                    this.filters.offset += this.filters.limit;

                    this.isTopicListLoading = false;
                },(err) => {
                    this.$log.warn('HomeCtrl.loadTopicList()', 'List fetch failed or was cancelled', err);
                    this.isTopicListLoading = false;
                }
            );
        };

        goToPage (url) {
            console.log(url);
            this.$window.location.href = url;
        }

    }
};

angular
    .module('citizenos')
    .component(home.selector, home);