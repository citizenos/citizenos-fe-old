'use strict';

angular
    .module('citizenos')
    .controller('GroupCreateCtrl', ['$scope', '$state', '$stateParams', '$log', function ($scope, $state, $stateParams, $log) {
        $log.debug('GroupCreateCtrl');

        $scope.tabSelected = 'settings';

    }]);
