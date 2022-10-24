import * as angular from 'angular';
import {find, chain} from 'lodash';

let my = {
    selector: 'myGroups',
    templateUrl: '/views/components/my.html',
    controller: ['$log', '$state', '$scope', '$stateParams', 'GroupMemberTopic', 'GroupService', 'AppService', class MyGroupsController {
        public options;
        public app;
        private groupMemberTopicsVisible = []; // goupId-s of which GroupMemberTopic list is expanded

        constructor ($log, $state, $scope, $stateParams, private GroupMemberTopic, private GroupService, AppService) {
            $log.debug('MyGroupsController');
            this.app = AppService;
            $log.debug('MyGroupsController', $state);
            GroupService.reload();
            if ($state.$current.name === 'my/groups') {
                $scope.$watch(() => GroupService.isLoading, (newVal, oldVal) => {
                    if (newVal === false) {
                        const params = angular.extend({}, $stateParams);
                        if (GroupService.groups.length) {
                            params.groupId = GroupService.groups[0].id;
                            $state.transitionTo('my/groups/groupId', params, {reload: false});
                        }
                    }
                });
            }
        };

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

    }]
};

angular
    .module('citizenos')
    .component(my.selector, my);

