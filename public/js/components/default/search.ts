'use strict';
import * as angular from 'angular';

let search = {
    selector: 'search',
    templateUrl: '/views/components/default/search.html',
    bindings: {},
    controller: ['$state', '$log', 'sAuth', 'sSearch', 'AppService', class SearchController {
        public form = {
            searchInput: null
        };
        public searchResults = {
            combined: []
        };
        public noResults = true;
        public viewMoreInProgress = false;
        public moreStr = null;

        constructor (private $state, private $log, private sAuth, private sSearch, private app) {
            $log.debug('SearchController');
        };

        combineResults () {
            this.searchResults.combined = [];

            const contexts = Object.keys(this.searchResults);
            contexts.forEach((context) => {
                const models = Object.keys(this.searchResults[context]);
                models.forEach((model) => {
                    if (this.searchResults[context][model].count > 0) {
                        this.noResults = false;
                        this.searchResults[context][model].rows.forEach((item, key) => {
                            if (item.id === 'viewMore') {
                                this.searchResults[context][model].rows.splice(key, 1);
                            }
                        });

                        const currentResults = this.searchResults[context][model].rows;
                        if (this.searchResults[context][model].count > this.searchResults[context][model].rows.length) {
                            currentResults.push({
                                id: 'viewMore',
                                model: model,
                                context: context
                            });
                        }
                        this.searchResults.combined = this.searchResults.combined.concat(currentResults);
                    }
                });
            });
            this.$log.debug('combineResults', this.searchResults);
        };

        enterAction () {
            this.doSearch(this.form.searchInput, true);
        };

        doSearch (str, noLimit) {
            if (this.viewMoreInProgress) {
                return this.form.searchInput = this.moreStr;
            }

            this.noResults = true;

            if (!str || str.length < 3 && !noLimit) {
                return this.app.showSearchResults = false;
            }
            var include = ['public.topic', 'public.group'];

            if (this.sAuth.user.loggedIn) {
                include = ['my.topic', 'my.group', 'public.topic', 'public.group'];
            }

            this.sSearch
                .search(
                    str,
                    {
                        include: include,
                        limit: 5
                    }
                ).then((result) => {
                    this.searchResults = result.data.data.results;
                    this.searchResults.combined = [];
                    this.app.showSearchResults = true;
                    this.app.showNav = false;
                    this.app.showSearchFiltersMobile = false;
                    this.combineResults();
                }, (err) => {
                    this.$log.error('SearchCtrl', 'Failed to retrieve search results', err);
                });
        };

        goToView (item, context) {
            console.log(context)
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
                    if (this.sAuth.user.loggedIn && context === 'my') {
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
                    if (this.sAuth.user.loggedIn && context === 'my' ) {
                        return this.$state.go(
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
                    console.log('GO TO VIEW')
                    this.$state.go(
                        'public/groups/view',
                        {
                            groupId: item.id
                        },
                        {
                            reload: true
                        }
                    );
                }
            }
        };

        viewMoreResults (context, model) {
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

                            this.searchResults[context][model].count = moreResults[context][model].count;
                            moreResults[context][model].rows.forEach((row) => {
                                this.searchResults[context][model].rows.push(row);
                            });

                            this.combineResults();

                            this.viewMoreInProgress = false;
                        },(err) => {
                            this.$log.error('SearchCtrl', 'Failed to retrieve search results', err);
                            this.viewMoreInProgress = false;
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
