'use strict';
import * as angular from 'angular';

let search = {
    selector: 'search',
    templateUrl: '/views/default/search.html',
    bindings: {},
    controller: ['$state', '$log', 'sAuth', 'sSearch', 'AppService', class SearchController {
        public app;
        public form = {
            searchInput: null
        };
        public searchResults = {
            combined: []
        };
        public noResults = true;
        public viewMoreInProgress = false;
        public moreStr = null;

        constructor (private $state, private $log, private sAuth, private sSearch, AppService) {
            this.$state = $state;
            this.$log = $log;
            this.sAuth = sAuth;
            this.sSearch = sSearch;
            $log.debug('sSearch');
            this.app = AppService;
            /*
                this.$watch(
                    function () {
                        return this.form.searchInput
                    }
                    , function (newValue, oldValue) {
                        if (newValue && newValue !== oldValue) {
                            this.doSearch(newValue);
                        }
                    }
                ); */
        };

        combineResults () {
            const self = this;
            this.searchResults.combined = [];

            const contexts = Object.keys(this.searchResults);
            contexts.forEach((context) => {
                const models = Object.keys(self.searchResults[context]);
                models.forEach((model) => {
                    if (self.searchResults[context][model].count > 0) {
                        self.noResults = false;
                        self.searchResults[context][model].rows.forEach((item, key) => {
                            if (item.id === 'viewMore') {
                                self.searchResults[context][model].rows.splice(key, 1);
                            }
                        });

                        const currentResults = self.searchResults[context][model].rows;
                        if (self.searchResults[context][model].count > self.searchResults[context][model].rows.length) {
                            currentResults.push({
                                id: 'viewMore',
                                model: model,
                                context: context
                            });
                        }
                        self.searchResults.combined = self.searchResults.combined.concat(currentResults);
                    }
                });
            });
            self.$log.debug('combineResults', this.searchResults);
        };

        enterAction () {
            this.doSearch(this.form.searchInput, true);
        };

        doSearch (str, noLimit) {
            const self = this;
            if (this.viewMoreInProgress) {
                return this.form.searchInput = this.moreStr;
            }

            this.noResults = true;

            if (!str || str.length < 3 && !noLimit) {
                return this.app.showSearchResults = false;
            }
            var include = ['public.topic'];

            if (this.sAuth.user.loggedIn) {
                include = ['my.topic', 'my.group', 'public.topic'];
            }

            this.sSearch
                .search(
                    str,
                    {
                        include: include,
                        limit: 5
                    }
                ).then((result) => {
                    self.searchResults = result.data.data.results;
                    self.searchResults.combined = [];
                    self.app.showSearchResults = true;
                    self.app.showNav = false;
                    self.app.showSearchFiltersMobile = false;
                    self.combineResults();
                }, (err) => {
                    self.$log.error('SearchCtrl', 'Failed to retrieve search results', err);
                });
        };

        goToView (item) {
            if (item) {
                this.app.showSearchResults = false;
                let model = 'topic';
                if (item.id === 'viewMore') {
                    model = 'viewMore';
                    return this.viewMoreResults(item.context, item.model);
                }

                if (item.hasOwnProperty('name')) {
                    model = 'group';
                }

                if (model == 'topic') {
                    if (this.sAuth.user.loggedIn) {
                        return this.$state.go(
                            'my/topics/topicId',
                            {
                                topicId: item.id,
                                filter: 'all'
                            },
                            {
                                reload: true
                            }
                        );
                    }
                    this.$state.go(
                        'topics/view',
                        {
                            topicId: item.id
                        },
                        {
                            reload: true
                        }
                    );
                } else if (model === 'group') {
                    this.$state.go(
                        'my/groups/groupId',
                        {
                            groupId: item.id,
                            filter: 'grouped'
                        },
                        {
                            reload: true
                        }
                    );
                }
            }
        };

        viewMoreResults (context, model) {
            const self = this;

            if (this.viewMoreInProgress) {
                return;
            } else {
                this.viewMoreInProgress = true;
                this.moreStr = this.form.searchInput;
            }

            if (context && model && this.searchResults[context][model].count > this.searchResults[context][model].rows.length - 1) { // -1 because the "viewMore" is added as an item that is not in the actual search result
                let include = context + '.' + model;
                if (model === 'topics') {
                    include = context + '.topic';
                } else if (model === 'groups') {
                    include = context + '.group';
                }

                const page = Math.floor(this.searchResults[context][model].rows.length / 5) + 1;

                this.sSearch
                    .search(
                        this.moreStr,
                        {
                            include: include,
                            limit: 5,
                            page: page
                        }
                    )
                    .then((result) => {
                            const moreResults = result.data.data.results;

                            self.searchResults[context][model].count = moreResults[context][model].count;
                            moreResults[context][model].rows.forEach((row) => {
                                self.searchResults[context][model].rows.push(row);
                            });

                            self.combineResults();

                            self.viewMoreInProgress = false;
                        },(err) => {
                            self.$log.error('SearchCtrl', 'Failed to retrieve search results', err);
                            self.viewMoreInProgress = false;
                        }
                    );
            }
        };

        closeSearchArea () {
            this.app.showSearchResults = false;
            this.form.searchInput = null;
            this.searchResults.combined = [];
            this.app.showSearch = false;
        };
    }]
};
angular
    .module('citizenos')
    .component(search.selector, search);
