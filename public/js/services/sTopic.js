angular
    .module('citizenos')
    .service('sTopic', ['$http', '$log', '$q', 'sLocation', 'Topic', function ($http, $log, $q, sLocation, Topic) {
        // TODO: Remove and make all use Topic?

        var sTopic = this;

        sTopic.STATUSES = Topic.STATUSES;

        sTopic.VISIBILITY = Topic.VISIBILITY;

        sTopic.CATEGORIES = Topic.CATEGORIES;

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

    }]);
