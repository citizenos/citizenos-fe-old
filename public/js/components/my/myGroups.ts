import * as angular from 'angular';

let my = {
    selector: 'myGroups',
    templateUrl: '/views/components/my/my.html',
    controller: ['$log', '$state', '$scope', '$stateParams','GroupService', 'AppService', class MyGroupsController {
        public options;

        constructor ($log, $state, $scope, $stateParams, private GroupService, private app) {
            $log.debug('MyGroupsController', $state);
            GroupService.reload();
            if ($state.$current.name === 'my/groups') {
                $scope.$watch(() => GroupService.isLoading, (newVal, oldVal) => {
                    if (newVal === false) {
                        const params = angular.extend({}, $stateParams);
                        if (GroupService.groups.length && !params.topicId) {
                            params.groupId = $stateParams.groupId || GroupService.groups[0].id;
                            $state.transitionTo('my/groups/groupId', params, {reload: false});
                        }
                    }
                });
            }
        };

    }]
};

angular
    .module('citizenos')
    .component(my.selector, my);

