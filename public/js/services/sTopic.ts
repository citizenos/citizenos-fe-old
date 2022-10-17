import * as angular from 'angular';

angular
    .module('citizenos')
    .service('sTopic', ['$http', '$state', '$stateParams', '$log', '$q', 'sLocation', 'Topic', 'ngDialog', function ($http, $state, $stateParams, $log, $q, sLocation, Topic, ngDialog) {
        // TODO: Remove and make all use Topic?

        var sTopic = this;

        sTopic.STATUSES = Topic.STATUSES;

        sTopic.VISIBILITY = Topic.VISIBILITY;

        sTopic.CATEGORIES = Topic.CATEGORIES;

        var defaultSuccess = function (response) {
            return response.data.data;
        };

        var defaultError = function (response) {
            return $q.reject(response);
        };

        sTopic.listUnauth = function (statuses, categories, showModerated, offset, limit) {
            var path = sLocation.getAbsoluteUrlApi('/api/topics');

            return $http.get(path, {
                params: {
                    statuses: statuses,
                    showModerated: showModerated,
                    categories: categories,
                    offset: offset,
                    limit: limit
                }
            });
        };

        sTopic.list = function () {
            var path = sLocation.getAbsoluteUrlApi('/api/users/self/topics');
            return $http.get(path);
        };

        sTopic.readUnauth = function (topic) {
            var path = sLocation.getAbsoluteUrlApi('/api/topics/:topicId', {topicId: topic.id});
            return $http.get(path);
        };

        sTopic.create = function (topic) {
            var path = sLocation.getAbsoluteUrlApi('/api/users/self/topics');
            return $http.post(path, topic);
        };

        sTopic.duplicate = function (topic) {
            var path = sLocation.getAbsoluteUrlApi('/api/users/self/topics/:topicId/duplicate', {topicId: topic.id});
            return $http
                .get(path)
                .then(defaultSuccess, defaultError);
        };

        sTopic.invites = function (topic) {
            var path = sLocation.getAbsoluteUrlApi('/api/users/self/topics/:topicId/invites/users', {topicId: topic.id});
            return $http.get(path).then(defaultSuccess, defaultError);
        };


        sTopic.getTopicNotificationSettings = function (topicId) {
            console.log(topicId);
            var path = sLocation.getAbsoluteUrlApi('/api/users/self/topics/:topicId/notificationsettings', {topicId: topicId});

            return $http.get(path).then(defaultSuccess, defaultError);
        };

        sTopic.updateTopicNotificationSettings = function (topicId, preferences) {
            var path = sLocation.getAbsoluteUrlApi('/api/users/self/topics/:topicId/notificationsettings', {topicId: topicId});

            return $http.put(path, preferences).then(defaultSuccess, defaultError);
        };

        sTopic.deleteTopicNotificationSettings = function (topicId) {
            var path = sLocation.getAbsoluteUrlApi('/api/users/self/topics/:topicId/notificationsettings', {topicId: topicId});

            return $http.delete(path).then(defaultSuccess, defaultError);
        };

        sTopic.notificationSettingsList = function (offset, limit, search) {
            var path = sLocation.getAbsoluteUrlApi('/api/users/self/notificationsettings/topics');

            return $http.get(path, {params: {offset: offset, limit: limit, search: search}}).then(defaultSuccess, defaultError);
        };

        sTopic.changeState = function (topic, state, stateSuccess) {
            var templates = {
                followUp: '/views/modals/topic_send_to_followUp_confirm.html',
                vote: '/views/modals/topic_close_confirm.html',
                closed: '/views/modals/topic_close_confirm.html'
            };
            var nextStates = {
                followUp: 'topics/view/followUp',
                vote: 'topics/view/votes/view',
                closed: 'topics/view'
            };

            ngDialog
                .openConfirm({
                    template: templates[state]
                })
                .then(() => {
                    if (state === 'vote' && !topic.voteId && !topic.vote) {
                        return $state.go('topics/view/votes/create', {
                            topicId: topic.id,
                            commentId: null
                        }, {reload: true});
                    }
                    return new Topic({
                        id: topic.id,
                        status: Topic.STATUSES[state]
                    }).$patch()
                })
                .then((topicPatched) => {
                    topic.status = topicPatched.status;
                    const stateNext = stateSuccess || nextStates[state];
                    const stateParams = angular.extend({}, $stateParams, {
                        editMode: null,
                        commentId: null
                    });
                    $state.go(
                        stateNext,
                        stateParams,
                        {
                            reload: true
                        }
                    );
                }, angular.noop);
        }
    }]);
