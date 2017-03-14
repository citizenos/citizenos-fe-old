'use strict';

app.controller('TopicVoteDelegateCtrl', ['$scope', '$state', '$log', 'sSearch', 'sAuth', 'TopicMemberUser', 'ngDialog', function ($scope, $state, $log, sSearch, sAuth, TopicMemberUser, ngDialog) {
    $log.debug('TopicVoteDelegateCtrl', $scope.ngDialogData);

    var topic = $scope.ngDialogData.topic;
    $scope.delegateUser = null;
    $scope.searchResults = {users: []};
    $scope.searchStringUser = null;

    $scope.search = function (str) {
        $log.debug('SEARCH');
        if (str && str.length >= 2) {
            var include = ['public.user'];

            var topicMembers = TopicMemberUser.query({topicId: topic.id});
            console.log(topicMembers);
            sSearch
                .searchV2(str, {include: include})
                .then(function (response) {
                    $scope.searchResults.users = [];
                    if (response.data.data.results.public.users) {
                        response.data.data.results.public.users.forEach(function (user) {
                            if(user.id !== sAuth.user.id) {
                                $scope.searchResults.users.push(user);
                            }
                        });
                    }
                });
        } else {
            $scope.searchResults.users = [];
        }
    };

    $scope.addUser = function (member) {
        console.log(member);
        if(member.id && member !== $scope.delegateUser) {
            $scope.delegateUser = member;
        }
        console.log($scope.delegateUser);
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
