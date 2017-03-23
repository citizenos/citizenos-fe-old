'use strict';

angular
    .module('citizenos')
    .controller('TopicVoteDelegateCtrl', ['$scope', '$log', 'TopicMemberUser', 'ngDialog', function ($scope, $log, TopicMemberUser, ngDialog) {
        $log.debug('TopicVoteDelegateCtrl', $scope.ngDialogData);

        var topic = $scope.ngDialogData.topic;
        $scope.delegateUser = null;
        $scope.searchResults = {users: []};
        $scope.searchStringUser = null;
        $scope.topicMembers = [];

        TopicMemberUser
            .query({topicId: topic.id}).$promise
            .then(function (topicMembers) {
                $scope.topicMembers = topicMembers;
            });

        $scope.search = function (str) {
            if (str && str.length >= 2) {
                $log.debug($scope.topicMembers);
                $scope.searchResults.users = _.filter($scope.topicMembers, function (member) {
                    return member.name.toLowerCase().indexOf(str.toLowerCase()) > -1;
                });
            } else {
                $scope.searchResults.users = [];
            }
        };

        $scope.addUser = function (member) {
            if (member.id && member !== $scope.delegateUser) {
                $scope.delegateUser = member;
            }
        };

        $scope.doRemoveDelegateUser = function () {
            $scope.delegateUser = null;
        };

        $scope.doSaveDelegate = function () {
            ngDialog.closeAll({ // Pass Vote options, so we can show selected option for the unauthenticated User
                delegateUser: $scope.delegateUser
            });
        }

    }]);
