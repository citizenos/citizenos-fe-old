'use strict';

angular
    .module('citizenos')
    .controller('TopicVoteCtrl', ['$scope', '$log', 'TopicVote', 'Vote', 'VoteDelegation', 'ngDialog', function ($scope, $log, TopicVote, Vote, VoteDelegation, ngDialog) {
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

        $scope.$parent.$parent.doVote = function (option) {
            if (!$scope.topic.canVote()) return;
            if ($scope.topic.vote.authType === $scope.voteAuthTypes.hard) {
                ngDialog
                    .open({
                        template: '/views/modals/topic_vote_sign.html',
                        controller: 'TopicVoteSignCtrl',
                        data: {
                            topic: $scope.topic,
                            option: option
                        },
                        preCloseCallback: function (data) {
                            if (data) {
                                console.log(data);
                                $scope.topic.vote.topicId = $scope.topic.id;
                                $scope.topic.vote.$get()
                                    .then(function () {
                                        $scope.topic.vote.options.rows.forEach(function (option) {
                                            data.options.forEach(function (dOption) {
                                                if (option.id === dOption.optionId) {
                                                    option.selected = true;
                                                }
                                            });
                                        });
                                        $scope.topic.vote.downloads = {bdocVote: data.bdocUri};
                                    });
                                return true;
                            }
                        }
                    });

                return;
            } else {
                var userVote = new TopicVote({id: $scope.topic.vote.id, topicId: $scope.topic.id});
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
            if (!$scope.topic.vote.delegation) {
                ngDialog
                    .open({
                        template: '/views/modals/topic_vote_delegate.html',
                        controller: 'TopicVoteDelegateCtrl',
                        data: {
                            topic: $scope.topic
                        },
                        preCloseCallback: function (data) {
                            $log.debug(data);
                            if (data && data.delegateUser && data.delegateUser.id) {
                                var delegation = new VoteDelegation({topicId: $scope.topic.id, voteId: $scope.topic.vote.id});
                                delegation.userId = data.delegateUser.id;
                                delegation
                                    .$save()
                                    .then(function (data) {
                                        $scope.topic.vote.topicId = $scope.topic.id;
                                        $scope.topic.vote.$get();
                                    });
                            }
                            return true;
                        }
                    })
            }
        };

        $scope.$parent.$parent.doRevokeDelegation = function () {
            $log.debug('doDeleteTopic');

            ngDialog
                .openConfirm({
                    template: '/views/modals/topic_vote_revoke_delegation_confirm.html',
                    data: {
                        user: $scope.topic.vote.delegation
                    }
                })
                .then(function () {
                    VoteDelegation
                        .delete({topicId: $scope.topic.id, voteId: $scope.topic.vote.id})
                        .$promise
                        .then(function () {
                            $scope.topic.vote.topicId = $scope.topic.id;
                            $scope.topic.vote.$get();
                        });
                }, angular.noop);
        };

        $scope.$parent.$parent.getVoteValuePercentage = function (value) {
            if (!$scope.topic.vote.getVoteCountTotal() || value < 1 || !value) return 0;
            return value / $scope.topic.vote.getVoteCountTotal() * 100;
        };

        $scope.$parent.$parent.getOptionLetter = function (index) {
            return String.fromCharCode(65 + index);
        };

    }]);
