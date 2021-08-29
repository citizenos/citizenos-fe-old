'use strict';

angular
    .module('citizenos')
    .controller('TopicVoteCreateCtrl', ['$scope', '$state', '$log', 'Vote', function ($scope, $state, $log, Vote) {
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

        $scope.$parent.$parent.endsAtMin = 0;
        $scope.$parent.$parent.endsAtH = 0;

        $scope.$parent.$parent.formatTime = function (val) {
            if (val < 10) {
                val = '0' + val;
            }
        }
        $scope.$parent.$parent.setEndsAtTime = function (h, min, z) {
            console.log($scope.voteForm);
            if (min) {
                $scope.$parent.$parent.endsAtMin = min;
                console.log($scope.voteForm.endsAt);
                $scope.voteForm.endsAt = moment($scope.voteForm.endsAt).minute(min)
            }
            if (h) {
                $scope.$parent.$parent.endsAtH = h;
                $scope.$parent.$parent.voteForm.endsAt = moment($scope.voteForm.endsAt).hour(h)
            }
            if (z) {
                $scope.voteForm.timezone = z;
                console.log('OFFSET', z*60)
                $scope.voteForm.endsAt = moment($scope.voteForm.endsAt).utcOffset(z*60)
            }
        };

        $scope.$parent.$parent.getTimeZoneName = function (value) {
            return ($scope.timezones.find(function(item) {return item.value === value})).name;
        }

        $scope.$parent.$parent.voteForm = {
            options: [],
            maxChoices: 1,
            minChoices: 1,
            extraOptions: angular.copy(CONF.extraOptions),
            delegationIsAllowed: false,
            endsAt: null,
            timezone: (new Date()).getTimezoneOffset()/60,
            voteType: null,
            authType: $scope.voteAuthTypes.soft,
            numberOfDaysLeft: 0,
            errors: null,
            autoClose: angular.copy(CONF.autoClose)
        };

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
            if ($scope.voteForm.endsAt) {
                if ($scope.voteForm.endsAt === true) {
                    $scope.voteForm.endsAt = new Date();
                }
                var endDate = $scope.voteForm.endsAt;
                var diffTime = new Date(endDate).getTime() - new Date().getTime();
                $scope.voteForm.numberOfDaysLeft = Math.ceil(diffTime / (1000 * 3600 * 24)); // Diff in days
            }
            return $scope.voteForm.numberOfDaysLeft;
        };

        $scope.$parent.$parent.createVote = function () {
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
            var endsAt = $scope.voteForm.endsAt;

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
                        console.log('SAVE ERR', res, res.data.errors);
                        $scope.$parent.$parent.voteForm.errors = res.data.errors;
                    }
                );
        };
    }]);
