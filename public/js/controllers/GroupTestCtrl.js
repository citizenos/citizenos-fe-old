'use strict';

angular
    .module('citizenos')
    .controller('GroupTestCtrl', ['$scope', '$state', '$stateParams', '$log', 'Group', function ($scope, $state, $stateParams, $log, Group) {
        $scope.groupList = [];
        $scope.form.group = new Group();

        console.log('FORM GROUP', $scope.form.group);

        Group
            .query().$promise
            .then(function (groups) {
                $log.debug('LOADED', groups);
                $scope.groupList = groups;
            }, function () {
            });
    }]);
