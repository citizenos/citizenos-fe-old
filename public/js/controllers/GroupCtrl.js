'use strict';

angular
    .module('citizenos')
    .controller('GroupCtrl', ['$scope', '$state', '$stateParams', '$log', function ($scope, $state, $stateParams, $log) {
        $log.debug('GroupCtrl');

        $scope.groupList = [];

        if($state.current.name === 'groups' ){
            $log.debug('GroupCtrl.groups');
        }
        if ($state.current.name === 'groups.create') {
            $log.debug('GroupCtrl.group.create');
        }
    }]);
