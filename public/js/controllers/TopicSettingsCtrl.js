'use strict';

angular
    .module('citizenos')
    .controller('TopicSettingsCtrl', ['$scope', '$state', '$stateParams', '$log', '$location', 'Topic', 'TopicVote', function ($scope, $state, $stateParams, $log, $location, Topic, TopicVote) {
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

        $scope.doEditVoteDeadline = function () {

            $scope.form.topic.vote.topicId = $scope.topic.id;
            return $scope.form.topic.vote
                .$update();
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
