'use strict';

angular
    .module('citizenos')
    .controller('GroupCtrl', ['$scope', '$state', '$stateParams', '$log', function ($scope, $state, $stateParams, $log) {
        $log.debug('GroupCtrl');
        $scope.group = _.find($scope.groupList, {id: $stateParams.groupId});

        $scope.isTopicListVisible = false;
        $scope.isTopicListSearchVisible = false;

        $scope.isUserListVisible = false;
        $scope.isUserListSearchVisible = false;

        $scope.doToggleTopicList = function (group) {
            if ($scope.isTopicListVisible) {
                $scope.isTopicListVisible = false;
                return;
            }

            group
                .getTopicList().$promise
                .then(function () {
                    $scope.isTopicListVisible = true;
                });
        };

        $scope.doToggleUserList = function (group) {
            if ($scope.isUserListVisible) {
                $scope.isUserListVisible = false;
                return;
            }

            group
                .getUserList().$promise
                .then(function () {
                    $scope.isUserListVisible = true;
                });
        };

        $scope.doDeleteGroup = function (group) {
            $log.debug('doDeleteGroup', group, $scope.groupList.indexOf(group));
            var index = $scope.groupList.indexOf(group);
            group
                .$delete()
                .then(function () {
                    $scope.groupList.splice(index, 1);
                    $state.go('mygroups');
                });
        }

    }]);
