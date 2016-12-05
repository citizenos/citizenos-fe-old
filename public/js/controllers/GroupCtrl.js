'use strict';

angular
    .module('citizenos')
    .controller('GroupCtrl', ['$scope', '$state', '$stateParams', '$log', 'sGroup', function ($scope, $state, $stateParams, $log, sGroup) {
        $log.debug('GroupCtrl');
        $scope.group = _.find($scope.groupList, {id: $stateParams.groupId});

        $scope.topicList = [];
        $scope.isTopicListVisible = false;
        $scope.isTopicListSearchVisible = false;

        $scope.userList = [];
        $scope.isUserListVisible = false;
        $scope.isUserListSearchVisible = false;

        $scope.doShowTopics = function () {
            if ($scope.isTopicListVisible) {
                $scope.isTopicListVisible = false;
                return;
            }

            sGroup
                .topicsList($scope.group.id)
                .then(function (res) {
                    $scope.topicList = res.data.data.rows;
                    $scope.isTopicListVisible = true;
                });
        };

        $scope.doShowUserList = function () {
            if ($scope.isUserListVisible) {
                $scope.isUserListVisible = false;
                return;
            }

            sGroup
                .membersList($scope.group.id)
                .then(function (res) {
                    $scope.userList = res.data.data.rows;
                    $scope.isUserListVisible = true;
                });
        };

    }]);
