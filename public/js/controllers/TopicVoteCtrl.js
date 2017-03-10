'use strict';

app.controller('TopicVoteCtrl', ['$scope', '$rootScope', '$state', '$log', '$timeout', 'TopicVote', 'Vote', 'ngDialog', function ($scope, $rootScope, $state, $log, $timeout, TopicVote, Vote, ngDialog) {
    $log.debug('TopicVoteCtrl');

    $scope.topic.vote.topicId = $scope.topic.id;
    $scope.topic.vote.$get();
    $scope.$parent.$parent.showVoteArea = true;
    $scope.$parent.$parent.voteTypes = Vote.VOTE_TYPES;
    $scope.$parent.$parent.voteAuthTypes = Vote.VOTE_AUTH_TYPES;

    $scope.$parent.$parent.getUserHasVoted = function () {
        if ($scope.topic.vote && $scope.topic.vote.options) {
            var options = $scope.topic.vote.options.rows;
            for (var i in options) {
                if (options[i].selected) {
                    return true;
                }
            }
        }
        return false;
    };

    $scope.$parent.$parent.getVoteHasEnded = function () {
        if ([$scope.STATUSES.followUp, $scope.STATUSES.closed].indexOf($scope.topic.status) > -1) {
            return true;
        }

        return $scope.topic.vote && $scope.topic.vote.endsAt && new Date() > new Date($scope.topic.vote.endsAt);
    };

    $scope.$parent.$parent.doVote = function (option) {
        if (!$scope.topic.canVote()) return;
        if ($scope.topic.vote.authType === $scope.voteAuthTypes.hard) {
            ngDialog
                .open({
                    template: '/views/modals/topic_vote_sign.html',
                    controller:'TopicVoteSignCtrl',
                    data: {
                        topic: $scope.topic,
                        option: option
                    },
                    preCloseCallback: function (data) {
                        if (data) {
                            $scope.topic.vote.topicId = $scope.topic.id;
                            $scope.topic.vote.$get()
                                .then(function (){
                                    console.log(data);
                                    $scope.topic.vote.options.rows.forEach(function (option) {
                                        data.options.forEach(function(dOption) {
                                            if(option.id === dOption.optionId) {
                                                option.selected = true;
                                            }
                                        });
                                    });
                                    $scope.topic.vote.downloads = {bdocVote:data.bdocUri};
                                });
                                return true;
                        }
                    }
                });

            return;
        } else {
            var userVote = new TopicVote({id: $scope.topic.vote.id, topicId:$scope.topic.id});
            userVote.options = [{optionId: option.id}];
            userVote
                .$save()
                .then(function (data) {
                    $scope.topic.vote.topicId = $scope.topic.id;
                    $scope.topic.vote.$get()
                });
        }
    };

    $scope.$parent.$parent.doDelegate = function () {
        ngDialog
            .open({
                template: '/views/modals/topic_vote_delegate.html',
                controller: 'TopicVoteDelegateCtrl',
                data: {
                    topic: $scope.topic
                },
                preCloseCallback: function (data) {
                    $log.debug(data);
                    return true;
                }
            })
    };
    /*$scope.doDelegate = function (user) {
        sTopic
            .voteDelegationCreate($state.params.id, $state.params.voteId, user.id)
            .then(function (res) {
                $log.log('Delegation success', res);
                $scope.init(); // Reload Vote so that delegation is visible
            }, function (res) {
                $log.error('Delegation failure', res);
                if (res.status === 400) {
                    $scope.app.showError(res.data.status.message);
                }
            });
    };*/

    /*$scope.doRevokeDelegation = function () {
        sTopic
            .voteDelegationDelete($state.params.id, $state.params.voteId)
            .then(function (res) {
                $log.log('Delegation deletion succeeded', res);
                $scope.init(); // Reload Vote so that delegation is visible
            }, function (res) {
                $log.error('Delegation deletion failure', res);
            });
    };*/

}]);
