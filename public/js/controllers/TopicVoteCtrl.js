'use strict';

angular
    .module('citizenos')
    .controller('TopicVoteCtrl', ['$scope', '$log', 'TopicVote', 'Vote', 'VoteDelegation', 'ngDialog', 'sNotification', function ($scope, $log, TopicVote, Vote, VoteDelegation, ngDialog, sNotification) {
        $log.debug('TopicVoteCtrl');

        $scope.topic.vote.topicId = $scope.topic.id;
        $scope.$parent.$parent.userHasVoted = false;
        $scope.$parent.$parent.showVoteArea = true;
        $scope.$parent.$parent.voteTypes = Vote.VOTE_TYPES;
        $scope.$parent.$parent.voteAuthTypes = Vote.VOTE_AUTH_TYPES;

        var getVote = function () {
            $scope.topic.vote.$get().then(function () {
                if ($scope.topic.vote && $scope.topic.vote.options) {
                    var options = $scope.topic.vote.options.rows;
                    for (var i in options) {
                        options[i].optionId = options[i].id;
                        if (options[i].selected) {
                            $scope.$parent.$parent.userHasVoted = true;
                        }
                    }
                }
            });
        };

        getVote();

        $scope.$parent.$parent.selectOption = function (option) {
            if ($scope.topic.vote.type === Vote.VOTE_TYPES.multiple) {
                option.optionId = option.id;

                var selected = _.filter($scope.topic.vote.options.rows, function (option) {
                    return !!option.selected;
                });

                var isSelected = _.find(selected, function (item) {
                    if (item.id === option.id) return item;
                });

                if (selected.length >= $scope.topic.vote.maxChoices && !isSelected) return;
                option.selected=!option.selected;
            } else {
                $scope.$parent.$parent.doVote(option);
            }

        };

        $scope.$parent.$parent.canSubmit = function () {
            var options = _.filter($scope.topic.vote.options.rows, function (option) {
                return !!option.selected;
            });

            if (options.length > $scope.topic.vote.maxChoices || options.length < $scope.topic.vote.minChoices)
                return false;

            return true;
        };

        $scope.$parent.$parent.doVote = function (option) {
            var options = [];
            if (!$scope.topic.canVote()) return;
            if (!option) {
                options = _.filter($scope.topic.vote.options.rows, function (option) {
                    return !!option.selected;
                });
            } else {
                options = [option];
            }
            if (options.length > $scope.topic.vote.maxChoices || options.length < $scope.topic.vote.minChoices) {
                sNotification.addError('MSG_ERROR_SELECTED_OPTIONS_COUNT_DOES_NOT_MATCH_VOTE_SETTINGS');
                return;
            }

            if ($scope.topic.vote.authType === $scope.voteAuthTypes.hard) {
                ngDialog
                    .open({
                        template: '/views/modals/topic_vote_sign.html',
                        controller: 'TopicVoteSignCtrl',
                        data: {
                            topic: $scope.topic,
                            options: options
                        },
                        preCloseCallback: function (data) {
                            if (data) {
                                $scope.topic.vote.topicId = $scope.topic.id;
                                $scope.topic.vote.$get()
                                    .then(function () {
                                        $scope.topic.vote.options.rows.forEach(function (option) {
                                            data.options.forEach(function (dOption) {
                                                option.optionId = option.id;
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
                userVote.options = options
                userVote
                    .$save()
                    .then(function (data) {
                        $scope.topic.vote.topicId = $scope.topic.id;
                        getVote();
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
