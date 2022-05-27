'use strict';

angular
    .module('citizenos')
    .controller('TopicSettingsCtrl', ['$scope', '$state', '$stateParams', '$log', '$location', '$translate', '$timeout', 'Topic', 'TopicVote', function ($scope, $state, $stateParams, $log, $location, $translate, $timeout, Topic, TopicVote) {
        $log.debug('TopicSettingsCtrl', $state, $stateParams);

        $scope.levels = {
            none: 0,
            read: 1,
            edit: 2,
            admin: 3
        };
        $scope.form = {
            topic: null,
            description: null,
            urlJoin: null
        };
        $scope.cosToggleTextOn = 'public';
        $scope.tabSelected = $stateParams.tab || 'settings';

        $scope.topicList = {
            searchFilter: '',
            searchOrderBy: {
                property: 'title'
            }
        };

        var init = function () {
            // Create a copy of parent scopes Topic, so that while modifying we don't change parent state
            $scope.form = {
                topic: null,
                description: null,
                urlJoin: null
            };
            $scope.form.topic = angular.copy($scope.topic);

            if ($scope.topic.status === Topic.STATUSES.voting && $scope.topic.voteId) {
                new TopicVote({
                    topicId: $scope.topic.id,
                    id: $scope.topic.voteId
                })
                    .$get()
                    .then(function (topicVote) {
                        $scope.topic.vote = topicVote;
                        $scope.form.topic.vote = angular.copy(topicVote);
                        if (topicVote.reminderTime && !topicVote.reminderSent) {
                            $scope.form.topic.vote.reminder = true;
                        }
                    });
            }

            $scope.form.description = angular.element($scope.topic.description).text().replace($scope.topic.title, '');
            $scope.Topic = Topic;

            $scope.searchString = null;
            $scope.searchResults = {};

            $scope.errors = null;

        };

        $scope.checkHashtag = function () {
            var length = 0;
            var str = $scope.form.topic.hashtag;
            var hashtagMaxLength = 59;

            if (str) {
                length = str.length;
                for (var i = 0; i < str.length; i++) {
                    var code = str.charCodeAt(i);
                    if (code > 0x7f && code <= 0x7ff) length++;
                    else if (code > 0x7ff && code <= 0xffff) length += 2;
                    if (code >= 0xDC00 && code <= 0xDFFF) i++; //trail surrogate
                }
            }

            if ((hashtagMaxLength - length) < 0) {
                $scope.errors = {hashtag: 'MSG_ERROR_40000_TOPIC_HASHTAG'};
            } else if ($scope.errors && $scope.errors.hashtag) {
                $scope.errors.hashtag = null;
            }
        };

        $scope.doDeleteHashtag = function () {
            $scope.form.topic.hashtag = null;
        };

        $scope.$watch(
            function () {
                return $scope.form.topic.vote.reminder
            },
            function (newVal, oldVal) {
                if (oldVal !== undefined && newVal === true) {
                    return $scope.setVoteReminder($scope.reminderOptions[0]);
                }
                else if (oldVal === true && newVal === false) {
                    $scope.doEditVoteDeadline();
                }
            }
        );

        $scope.doEditVoteDeadline = function () {
            if (!$scope.form.topic.vote.reminder && !$scope.form.topic.vote.reminderSent) {
                $scope.form.topic.vote.reminderTime = null;
            }
            $scope.form.topic.vote.topicId = $scope.topic.id;

            return $scope.form.topic.vote
                .$update()
                .then(function(voteValue) {
                    if (voteValue.reminderTime && !voteValue.reminderSent) {
                        $scope.form.topic.vote.reminder = true;
                    } else {
                        $scope.form.topic.vote.reminder = false;
                    }
                });
        };

        $scope.selectTab = function (tab) {
            $scope.tabSelected = tab;
            $location.search({tab: tab});
        };

        $scope.addTopicCategory = function (category) {
            if ($scope.form.topic.categories.indexOf(category) === -1 && $scope.form.topic.categories.length < Topic.CATEGORIES_COUNT_MAX) {
                $scope.form.topic.categories.push(category);
            }
        };

        $scope.removeTopicCategory = function (category) {
            $scope.form.topic.categories.splice($scope.form.topic.categories.indexOf(category), 1);
        };

        $scope.doOrderTopics = function (property) {
            if ($scope.topicList.searchOrderBy.property == property) {
                property = '-' + property;
            }
            $scope.topicList.searchOrderBy.property = property;
        };

        $scope.reminderOptions = [{value: 1, unit: 'days'}, {value: 2, unit: 'days'}, {value: 3, unit: 'days'}, {value: 1, unit: 'weeks'}, {value: 2, unit: 'weeks'}, {value: 1, unit: 'month'}];

        $scope.isVisibleReminderOption = function (time) {
            var timeItem = moment($scope.topic.vote.endsAt).clone().subtract(time.value, time.unit);
            var now = moment();
            if (moment(moment(timeItem.toString())) > now) return true;

            return false;
        };

        $scope.selectedReminderOption = function () {
            var days = moment($scope.topic.vote.endsAt).clone().diff($scope.form.topic.vote.reminderTime, 'days');
            var weeks = moment($scope.topic.vote.endsAt).clone().diff($scope.form.topic.vote.reminderTime, 'weeks');
            var months = moment($scope.topic.vote.endsAt).clone().diff($scope.form.topic.vote.reminderTime, 'months');
            var item = $scope.reminderOptions.find(function (item) {
                if ( item.value === days && item.unit === 'days') return item;
                else if ( item.value === weeks && item.unit === 'weeks') return item;
                else if ( item.value === months && item.unit === 'month') return item;
            });
            if (item) {
                return $translate.instant('OPTION_' + item.value + '_'+ item.unit.toUpperCase());
            }
        };

        $scope.setVoteReminder = function (time) {
            var reminderTime = moment($scope.form.topic.vote.endsAt).clone().subtract(time.value, time.unit);
            $scope.form.topic.vote.reminderTime = reminderTime.format();
            $scope.doEditVoteDeadline();
        };

        $scope.doSaveTopic = function () {
            $scope.errors = null;

            if ($scope.form.topic.visibility === true || $scope.form.topic.visibility === 'private') {
                $scope.form.topic.visibility = 'private';
            } else {
                $scope.form.topic.visibility = 'public';
            }
            if ($scope.form.topic.endsAt && $scope.topic.endsAt === $scope.form.topic.endsAt) { //Remove endsAt field so that topics with endsAt value set could be updated if endsAt is not changed
                delete $scope.form.topic.endsAt;
            }
            $scope.form.topic
                .$update()
                .then(
                    function () {
                        $state.go($state.current.parent, {topicId: $scope.topic.id}, {reload: true});
                    },
                    function (errorResponse) {
                        if (errorResponse.data && errorResponse.data.errors) {
                            $scope.errors = errorResponse.data.errors;
                        }
                    }
                );
        };

        init();
    }]);
