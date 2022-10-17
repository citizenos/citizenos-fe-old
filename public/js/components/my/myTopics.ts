import * as angular from 'angular';
import {find, chain} from 'lodash';

let my = {
    selector: 'myTopics',
    templateUrl: '/views/components/my.html',
    controller: ['$log', '$state', '$stateParams', '$location', 'sAuth', 'Topic', 'AppService', class MyTopicsController {
        public options;
        public itemsList = [];
        public app;
        public filters;
        public topicFilters = [
            {
                id: 'all',
                name: 'VIEWS.MY.FILTERS.SHOW_ALL_MY_TOPICS'
            },
            {
                name: 'VIEWS.MY.FILTERS.SHOW_ONLY',
                children: [
                    {
                        id: 'public',
                        name: 'VIEWS.MY.FILTERS.MY_PUBLIC_TOPICS'
                    },
                    {
                        id: 'private',
                        name: 'VIEWS.MY.FILTERS.MY_PRIVATE_TOPICS'
                    },
                    {
                        id: 'haveVoted',
                        name: 'VIEWS.MY.FILTERS.TOPICS_I_HAVE_VOTED'
                    },
                    {
                        id: 'haveNotVoted',
                        name: 'VIEWS.MY.FILTERS.TOPICS_I_HAVE_NOT_VOTED'
                    },
                    {
                        id: 'iCreated',
                        name: 'VIEWS.MY.FILTERS.TOPICS_I_CREATED'
                    },
                    {
                        id: 'inProgress',
                        name: 'VIEWS.MY.FILTERS.TOPICS_IN_PROGRESS'
                    },
                    {
                        id: 'voting',
                        name: 'VIEWS.MY.FILTERS.TOPICS_IN_VOTING'
                    },
                    {
                        id: 'followUp',
                        name: 'VIEWS.MY.FILTERS.TOPICS_IN_FOLLOW_UP'
                    },
                    {
                        id: 'closed',
                        name: 'VIEWS.MY.FILTERS.TOPICS_CLOSED'
                    },
                    {
                        id: 'pinnedTopics',
                        name: 'VIEWS.MY.FILTERS.TOPICS_PINNED'
                    },
                    {
                        id: 'showModerated',
                        name: 'VIEWS.MY.FILTERS.TOPICS_MODERATED'
                    }
                ]
            },
            {
                id: 'grouped',
                name: 'VIEWS.MY.FILTERS.TOPICS_ORDERED_BY_GROUPS'
            }
        ];

        constructor ($log, private $state, private $stateParams, private $location, private sAuth, private Topic, AppService) {
            $log.debug('MyController');
            this.app = AppService;
            $log.debug('MyCtrl', $state);
            const filterParam = $stateParams.filter || this.topicFilters[0].id;
            this.filters = {
                items: this.topicFilters,
                selected: find(this.topicFilters, {id: filterParam}) || chain(this.topicFilters).map('children').flatten().find({id: filterParam}).value() || this.topicFilters[0]
            };
            this.loadItems();
        };

        loadItems () {
            let filterParam = this.$stateParams.filter || 'all';
            const urlParams = {
                prefix: null,
                userId: null,
                visibility: null,
                hasVoted: null,
                creatorId: null,
                statuses: null,
                pinned: null,
                showModerated: null
            };
            const path = this.$location.path();

            if (!this.$stateParams.filter && (path.indexOf('groups') > -1)) {
                filterParam = 'grouped';
            }

            if (this.sAuth.user.loggedIn) {
                Object.assign(urlParams, {prefix: 'users', userId: 'self'});
            }
            if (this.Topic.STATUSES[filterParam]) {
                urlParams.statuses = filterParam;
            } else if(this.Topic.VISIBILITY[filterParam]) {
                urlParams.visibility = filterParam;
            } else {
                switch (filterParam) {
                    case 'all':
                        break;
                    case 'haveVoted':
                        urlParams.hasVoted = true;
                        break;
                    case 'haveNotVoted':
                        urlParams.hasVoted = false;
                        break;
                    case 'iCreated':
                        urlParams.creatorId = this.sAuth.user.id;
                        break;
                    case 'pinnedTopics':
                        urlParams.pinned = true;
                        break;
                    case 'showModerated':
                        urlParams.showModerated = true;
                        break;
                };
            }

            this.Topic.query(urlParams)
                .$promise
                .then((items) => {
                    this.itemsList = items;
                    const params = angular.extend({}, this.$stateParams);
                    if (items.length) {
                        params.topicId = items[0].id;
                        this.$state.transitionTo('my/topics/topicId', params), {reload: true};
                    }
                });
        }

        onSelect (id) {
            this.$state.go('my/topics', {filter: id}, {reload: true});
        }

    }]
};

angular
    .module('citizenos')
    .component(my.selector, my);

