angular
    .module('citizenos')
    .service('sTopic', ['$http', '$log', '$q', 'sLocation', 'Topic', function ($http, $log, $q, sLocation, Topic) {
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
    }]);
