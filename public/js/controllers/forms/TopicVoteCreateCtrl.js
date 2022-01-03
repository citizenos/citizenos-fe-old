'use strict';

angular
    .module('citizenos')
    .controller('TopicVoteCreateCtrl', ['$scope', '$state', '$log', 'sNotification', 'Vote', function ($scope, $state, $log, sNotification, Vote) {
        $log.debug('TopicVoteCreateCtrl');

        $scope.$parent.$parent.datePickerMin = new Date();
        $scope.$parent.$parent.voteTypes = Vote.VOTE_TYPES;
        $scope.$parent.$parent.voteAuthTypes = Vote.VOTE_AUTH_TYPES;

        var CONF = {
            defaultOptions: {
                regular: [
                    {
                        value: 'Yes',
                        enabled: true
                    },
                    {
                        value: 'No',
                        enabled: true
                    }
                ],
                multiple: [
                    {value: null},
                    {value: null},
                    {value: null}
                ]
            },
            extraOptions: {
                neutral: {
                    value: 'Neutral',
                    enabled: false
                }, // enabled - is the option enabled by default
                veto: {
                    value: 'Veto',
                    enabled: false
                }
            },
            autoClose: {
                allMembersVoted: {
                    value: 'allMembersVoted',
                    enabled: false
                }
            },
            optionsMax: 10,
            optionsMin: 2
        };

        $scope.showVoteCreate();

        $scope.$parent.$parent.timezones = [
            {name: "Etc/GMT+0", value: 0},
            {name: "Etc/GMT+1", value: 1},
            {name: "Etc/GMT+2", value: 2},
            {name: "Etc/GMT+3", value: 3},
            {name: "Etc/GMT+4", value: 4},
            {name: "Etc/GMT+5", value: 5},
            {name: "Etc/GMT+6", value: 6},
            {name: "Etc/GMT+7", value: 7},
            {name: "Etc/GMT+8", value: 8},
            {name: "Etc/GMT+9", value: 9},
            {name: "Etc/GMT+10", value: 10},
            {name: "Etc/GMT+11", value: 11},
            {name: "Etc/GMT+12", value: 12},
            {name: "Etc/GMT-0", value: -0},
            {name: "Etc/GMT-1", value: -1},
            {name: "Etc/GMT-2", value: -2},
            {name: "Etc/GMT-3", value: -3},
            {name: "Etc/GMT-4", value: -4},
            {name: "Etc/GMT-5", value: -5},
            {name: "Etc/GMT-6", value: -6},
            {name: "Etc/GMT-7", value: -7},
            {name: "Etc/GMT-8", value: -8},
            {name: "Etc/GMT-9", value: -9},
            {name: "Etc/GMT-10", value: -10},
            {name: "Etc/GMT-11", value: -11},
            {name: "Etc/GMT-12", value: -12},
            {name: "Etc/GMT-13", value: -13},
            {name: "Etc/GMT-14", value: -14}
        ];

        $scope.$parent.$parent.HCount = 24;

        $scope.$parent.$parent.formatTime = function (val) {
            if (val < 10) {
                val = '0' + val;
            }
        };

        $scope.$parent.$parent.getTimeZoneName = function (value) {
            return ($scope.timezones.find(function(item) {return item.value === value})).name;
        };

        $scope.$parent.$parent.voteForm = {
            options: [],
            maxChoices: 1,
            minChoices: 1,
            extraOptions: angular.copy(CONF.extraOptions),
            delegationIsAllowed: false,
            endsAt: {
                date: null,
                min: 0,
                h: 0,
                timezone: moment().utcOffset()/60,
                timeFormat: 24
            },
            deadline: null,
            voteType: null,
            authType: $scope.voteAuthTypes.soft,
            numberOfDaysLeft: 0,
            errors: null,
            autoClose: angular.copy(CONF.autoClose)
        };

        $scope.$parent.$parent.setTimeFormat = function () {
            $scope.HCount = 24;

            if ($scope.$parent.$parent.voteForm.timeFormat !== 24) {
                $scope.HCount = 12;
                if ($scope.voteForm.endsAt.h > 12) {
                    $scope.voteForm.endsAt.h -= 12;
                }
            }
            $scope.setEndsAtTime();
        };

        $scope.$parent.$parent.setEndsAtTime = function () {
            $scope.voteForm.endsAt.date = $scope.voteForm.endsAt.date || moment(new Date());
            $scope.voteForm.deadline = moment($scope.voteForm.endsAt.date);
            $scope.voteForm.deadline.utcOffset($scope.voteForm.endsAt.timezone, true);
            var hour = $scope.voteForm.endsAt.h;
            if ($scope.voteForm.endsAt.timeFormat === 'PM') { hour += 12; }
            $scope.voteForm.deadline.hour(hour);
            $scope.voteForm.deadline.minute($scope.voteForm.endsAt.min);
        };

        $scope.$watch(
            function () {
                return $scope.voteForm.endsAt.date
            }
            , function (newValue, oldValue) {
                if (newValue && newValue !== oldValue) {
                    $scope.setEndsAtTime();
                }
            }
        );
        $scope.$parent.$parent.optionsCountUp = function (type) {
            var options = _.filter($scope.voteForm.options, function (option) {
                return !!option.value;
            });
            if (type === 'min' && $scope.$parent.$parent.voteForm.minChoices < options.length) {
                $scope.voteForm.minChoices++;
                if ($scope.voteForm.minChoices > $scope.voteForm.maxChoices) {
                    $scope.voteForm.maxChoices = $scope.voteForm.minChoices;
                }
            } else if ($scope.$parent.$parent.voteForm.maxChoices < options.length) {
                $scope.voteForm.maxChoices++;
            }
        };

        $scope.$parent.$parent.optionsCountDown = function (type) {
            if (type === 'min' && $scope.$parent.$parent.voteForm.minChoices > 1) {
                $scope.voteForm.minChoices--;
            }
            else if ($scope.$parent.$parent.voteForm.maxChoices > 1) {
                $scope.voteForm.maxChoices--;
                if ($scope.voteForm.minChoices > $scope.voteForm.maxChoices) {
                    $scope.voteForm.minChoices = $scope.voteForm.maxChoices;
                }
            }
        };

        $scope.$parent.$parent.setVoteType = function (voteType) {
            if (voteType == $scope.voteTypes.multiple) {
                $scope.voteForm.voteType = voteType;
                $scope.voteForm.options = angular.copy(CONF.defaultOptions.multiple);
                $scope.voteForm.maxChoices = 1;
            } else {
                $scope.voteForm.voteType = $scope.voteTypes.regular;
                $scope.voteForm.options = angular.copy(CONF.defaultOptions.regular);
            }
        };

        $scope.$parent.$parent.getStepNum = function (num) {
            if ($scope.voteForm.voteType === $scope.voteTypes.multiple) {
                num++;
            }

            return num;
        };

        $scope.$parent.$parent.removeOption = function (key) {
            $scope.voteForm.options.splice(key, 1);
        };

        $scope.$parent.$parent.addOption = function () {
            $scope.voteForm.options.push({value: null});
        };

        $scope.$parent.$parent.daysToVoteEnd = function () {
            if ($scope.voteForm.deadline) {
                if ($scope.voteForm.deadline === true) {
                    $scope.voteForm.deadline = moment(new Date()).startOf('day').add(1, 'day');
                    $scope.voteForm.endsAt.date = $scope.voteForm.deadline;
                }
                $scope.voteForm.numberOfDaysLeft = $scope.voteForm.deadline.diff(new Date(), 'days') + 1;
            }
            return $scope.voteForm.numberOfDaysLeft;
        };

        $scope.$parent.$parent.createVote = function () {
            sNotification.removeAll();

            var vote = new Vote({topicId: $scope.topic.id});
            vote.options = angular.copy($scope.voteForm.options);
            vote.delegationIsAllowed = $scope.voteForm.delegationIsAllowed;
            vote.type = $scope.voteForm.voteType;
            vote.authType = $scope.voteForm.authType;
            vote.maxChoices = $scope.voteForm.maxChoices;
            vote.minChoices = $scope.voteForm.minChoices;

            for (var o in $scope.voteForm.extraOptions) {
                var option = $scope.voteForm.extraOptions[o];
                if (option.enabled) {
                    vote.options.push({value: option.value});
                }
            }

            var autoClose = [];
            for (var i in $scope.voteForm.autoClose) {
                var option = $scope.voteForm.autoClose[i];
                if (option.enabled) {
                    autoClose.push({value: option.value});
                }
            }

            if (!autoClose.length) {
                autoClose = null;
            }
            vote.autoClose = autoClose;

            vote.options = _.filter(vote.options, function (option) {
                return !!option.value
            });

            // Ends at midnight of the date chosen, thus 00:00:00 of the next day.
            var endsAt = $scope.voteForm.deadline;

            if (endsAt) {
                vote.endsAt = endsAt;
            }

            vote
                .$save(
                    function (vote, putResponseHeaders) {
                        $scope.$parent.$parent.voteForm.errors = null;
                        $state.go('topics.view.votes.view', {
                            topicId: $scope.topic.id,
                            voteId: vote.id
                        }, {reload: true});
                    },
                    function (res) {
                        $log.debug('createVote() ERR', res, res.data.errors,  $scope.voteForm.options);
                        $scope.$parent.$parent.voteForm.errors = res.data.errors;
                    }
                );
        };
    }]);
