import * as angular from 'angular';

let my = {
    selector: 'myView',
    templateUrl: '/views/components/my.html',
    controller: ['$log', '$state', '$stateParams', '$location', 'sAuth', 'Topic', 'Group', 'GroupMemberTopic', 'GroupService', 'AppService', class MyController {
        public options;
        public itemsList = [];
        public app;
        private sAuth;
        private Topic;
        private Group;
        private GroupService;
        private GroupMemberTopic;
        private $state;
        private $stateParams;
        private $location;
        private groupMemberTopicsVisible = []; // goupId-s of which GroupMemberTopic list is expanded
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

        public groupFilters = [
            {
                name: 'VIEWS.MY.FILTERS_GROUP_TOPICS.SHOW_ONLY',
                children: [
                    {
                        id: 'inProgress',
                        name: 'VIEWS.MY.FILTERS_GROUP_TOPICS.TOPICS_IN_PROGRESS'
                    },
                    {
                        id: 'voting',
                        name: 'VIEWS.MY.FILTERS_GROUP_TOPICS.TOPICS_IN_VOTING'
                    },
                    {
                        id: 'followUp',
                        name: 'VIEWS.MY.FILTERS_GROUP_TOPICS.TOPICS_IN_FOLLOW_UP'
                    },
                    {
                        id: 'closed',
                        name: 'VIEWS.MY.FILTERS_GROUP_TOPICS.TOPICS_CLOSED'
                    }
                ]
            },
            {
                name: 'VIEWS.MY.FILTERS_GROUP_TOPICS.ORDER_TOPICS_BY',
                children: [
                    {
                        id: 'status.ascending',
                        name: 'VIEWS.MY.FILTERS_GROUP_TOPICS.STATUS_ASCENDING'
                    },
                    {
                        id: 'status.descending',
                        name: 'VIEWS.MY.FILTERS_GROUP_TOPICS.STATUS_DESCENDING'
                    },
                    {
                        id: 'pinned.descending',
                        name: 'VIEWS.MY.FILTERS_GROUP_TOPICS.PINNED_DESCENDING'
                    },
                    {
                        id: 'pinned.ascending',
                        name: 'VIEWS.MY.FILTERS_GROUP_TOPICS.PINNED_ASCENDING'
                    },
                    {
                        id: 'lastActivity.ascending',
                        name: 'VIEWS.MY.FILTERS_GROUP_TOPICS.ACTIVITY_ASCENDING'
                    },
                    {
                        id: 'lastActivity.descending',
                        name: 'VIEWS.MY.FILTERS_GROUP_TOPICS.ACTIVITY_DESCENDING'
                    }
                ]
            }
        ];

        constructor ($log, $state, $stateParams, $location, sAuth, Topic, Group, GroupMemberTopic, AppService, GroupService) {
            $log.debug('MyController');
            this.Topic = Topic;
            this.Group = Group;
            this.sAuth = sAuth;
            this.GroupService = GroupService;
            this.GroupMemberTopic = GroupMemberTopic;
            this.$state = $state;
            this.$stateParams = $stateParams;
            this.$location = $location;
            this.app = AppService;
            $log.debug('MyCtrl', $state);
            this.loadItems();
            console.log('MyCtrl', this.itemsList);
        };

        loadItems () {
            const self = this;
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

            switch (filterParam) {
                case 'all':
                    break;
                case 'public':
                    urlParams.visibility = this.Topic.VISIBILITY.public;
                    break;
                case 'private':
                    urlParams.visibility = this.Topic.VISIBILITY.private;
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
                case 'inProgress':
                    urlParams.statuses = this.Topic.STATUSES.inProgress;
                    break;
                case 'voting':
                    urlParams.statuses = this.Topic.STATUSES.voting;
                    break;
                case 'followUp':
                    urlParams.statuses = this.Topic.STATUSES.followUp;
                    break;
                case 'closed':
                    urlParams.statuses = this.Topic.STATUSES.closed;
                    break;
                case 'pinnedTopics':
                    urlParams.pinned = true;
                    break;
                case 'showModerated':
                    urlParams.showModerated = true;
                    break;
                case 'grouped':
                    if (this.GroupService.isLoading !== false) {
                        self.itemsList = self.GroupService.groups;
                    }
                    break;
            };
            this.Topic.query(urlParams)
                .$promise
                .then((items) => {
                    self.itemsList = items;
                });
        }

        selectTopic (filter) {
            this.$state.go('my/topics', {filter: filter}, {reload: true});
        }

        selectGroup (filter) {
            this.$state.go('my/groups', {filter: filter}, {reload: true});
        }
/*
        var filterParam = $stateParams.filter || filters[0].id;
        $scope.filters = {
            items: filters,
            selected: _.find(filters, {id: filterParam}) || _.chain(filters).map('children').flatten().find({id: filterParam}).value() || filters[0]
        };

        private groupFilters = {
            items: groupFilters,
            selected: _.find(groupFilters, {id: filterParam}) || _.chain(groupFilters).map('children').flatten().find({id: filterParam}).value() || groupFilters[0]
        }*/

     /*   $scope.$watch('itemList.length',
            function (newList) {
                if (!newList) return;
                // Navigate to first item in the list on big screens.
                if ($rootScope.wWidth > 750) {

                    $timeout(function () {
                        if ($state.is('my/groups') || $state.is('my/topics')) {
                            var item = $scope.itemList[0];
                            console.log(item);
                            if ($scope.isGroup(item)) {
                                $state.go('my/groups/groupId', {
                                    groupId: item.id,
                                    filter: 'grouped'
                                });
                            } else {
                                $state.go('my/topics/topicId', {topicId: item.id});
                            }
                        }
                    });
                }
            }, true
        );*/

        isGroup (object) {
            return object instanceof this.Group;
        }

        isGroupMemberTopicsVisible (group) {
            return this.groupMemberTopicsVisible.indexOf(group.id) > -1;
        }

        doToggleGroupTopicList (group) {
            const self = this;
            const indexGroupIdVisible = this.groupMemberTopicsVisible.indexOf(group.id);

            if (indexGroupIdVisible < 0) { // not visible
                this.GroupMemberTopic
                    .query({groupId: group.id}).$promise
                    .then((topics) => {
                        group.members.topics.rows = topics;
                        group.members.topics.count = topics.length;
                        self.groupMemberTopicsVisible.push(group.id);
                    });
            } else { // already visible, we hide
                this.groupMemberTopicsVisible.splice(indexGroupIdVisible, 1);
            }
        };

    }]
};

angular
    .module('citizenos')
    .component(my.selector, my);

