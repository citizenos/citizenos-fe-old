import * as angular from 'angular';

let my = {
    selector: 'myGroups',
    templateUrl: '/views/components/my.html',
    controller: class MyGroupsController {
        public options;
        public itemsList = [];
        public app;
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

        constructor ($log, $state, $scope, $stateParams, private GroupMemberTopic, private GroupService, AppService) {
            $log.debug('MyController');
            this.app = AppService;
            $log.debug('MyCtrl', $state);
            this.loadItems();
            if ($state.$current.name === 'my/groups') {
                $scope.$watch(() => GroupService.isLoading, (newVal, oldVal) => {
                    if (newVal === false) {
                        const params = angular.extend({}, $stateParams);
                        params.groupId = GroupService.groups[0].id;
                        $state.transitionTo('my/groups/groupId', params, {reload: false});
                    }
                });
            }
        };

        loadItems () {
            this.itemsList = this.GroupService.groups;
        }

        doToggleGroupTopicList (group) {
            const indexGroupIdVisible = this.groupMemberTopicsVisible.indexOf(group.id);

            if (indexGroupIdVisible < 0) { // not visible
                this.GroupMemberTopic
                    .query({groupId: group.id}).$promise
                    .then((topics) => {
                        group.members.topics.rows = topics;
                        group.members.topics.count = topics.length;
                        this.groupMemberTopicsVisible.push(group.id);
                    });
            } else { // already visible, we hide
                this.groupMemberTopicsVisible.splice(indexGroupIdVisible, 1);
            }
        };

    }
};

angular
    .module('citizenos')
    .component(my.selector, my);

