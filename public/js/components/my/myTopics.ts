import * as angular from 'angular';
import {find, chain} from 'lodash';

let my = {
    selector: 'myTopics',
    templateUrl: '/views/components/my/my.html',
    controller: ['$scope', '$log', '$state', '$stateParams', '$location', 'sAuth', 'Topic', 'TopicService', 'AppService', class MyTopicsController {
        public options;
        public topicList = [];
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

        constructor ($scope, $log, private $state, private $stateParams, private $location, private sAuth, private Topic, private TopicService, private app) {
            $log.debug('MyController');
            $log.debug('MyCtrl', $state);
            let filterParam = $stateParams.filter || this.topicFilters[0].id;
            this.filters = {
                items: this.topicFilters,
                selected: find(this.topicFilters, {id: filterParam}) || chain(this.topicFilters).map('children').flatten().find({id: filterParam}).value() || this.topicFilters[0]
            };

            if (!this.$stateParams.filter && (this.$location.path().indexOf('groups') > -1)) {
                filterParam = 'grouped';
            }

         /*   this.TopicService.filterTopics(filterParam)
            if ($state.$current.name === 'my/topics') {
                $scope.$watch(() => TopicService.topics.length, (newVal, oldVal) => {
                    console.log('MyTopics watcher')
                    const params = angular.extend({}, $stateParams);
                    if (newVal > 0 && !params.topicId) {
                        params.topicId = TopicService.topics[0].id;
                        $state.go('my/topics/topicId', params, {reload: false});
                    }
                });
            }*/
        };

        onSelect (id) {
            this.$state.go('my/topics', {filter: id}, {reload: true});
        }

    }]
};

angular
    .module('citizenos')
    .component(my.selector, my);

