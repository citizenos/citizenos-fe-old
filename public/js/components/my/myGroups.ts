import * as angular from 'angular';

let my = {
    selector: 'myGroups',
    templateUrl: '/views/components/my.html',
    controller: ['$log', '$state', '$stateParams', '$location', 'sAuth', 'Topic', 'Group', 'GroupMemberTopic', 'GroupService', 'AppService', class MyGroupsController {
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

        constructor ($log, $state, $stateParams, $location, sAuth, Topic, Group, GroupMemberTopic, GroupService, AppService) {
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
            console.log(this.GroupService);
            this.itemsList = this.GroupService.groups;
          /*  return this.Group.query().then((items) => {
                console.log(items);
                self.itemsList = items;
                const params = angular.extend({}, this.$stateParams);
                if (self.$state.$current.name !== 'my/groups/create') {
                    params.groupId = items[0].id;
                    self.$state.transitionTo('my/groups/groupId', params);
                }
            });*/
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

