'use strict';

angular
    .module('citizenos')
    .controller('MyGroupsCtrl', ['$scope', '$log', 'sGroup', function ($scope, $log, sGroup) {
        $log.debug('MyGroupsCtrl');

        $scope.groupList = [];
        $scope.isGroupListLoading = true;

        sGroup
            .list()
            .then(function (res) {
                $scope.groupList = res.data.data.rows;
                $scope.isGroupListLoading = false;
            }, function (res) {
                $log.log('MyGroupsCtrl', 'Group list fetch failed', res);
                $scope.isGroupListLoading = false;
            });

    }]);
