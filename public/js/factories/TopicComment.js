angular
    .module('citizenos')
    .factory('TopicComment', ['$log', '$resource', 'sLocation', 'sAuth', function ($log, $resource, sLocation, sAuth) {
        $log.debug('citizenos.factory.TopicComment');

        var path = '/api/:prefix/:userId/topics/:topicId/comments/:commentId';

        var TopicComment = $resource(
            sLocation.getAbsoluteUrlApi(path),
            {topicId: '@topicId', commentId: '@id'},
            {
                save: {
                    method:'POST',
                    params: {topicId: '@topicId', commentId: '@id', prefix: sAuth.getUrlPrefix, userId: sAuth.getUrlUserId},
                    transformRequest: function (data) {
                        return angular.toJson(data);
                    },
                    transformResponse: function (data, headersGetter, status) {
                        if (status > 0 && status < 400) { // TODO: think this error handling through....
                            return angular.fromJson(data).data;
                        } else {
                            return angular.fromJson(data);
                        }
                    }
                },
                query: {
                    isArray: true,
                    params: {topicId: '@topicId', commentId: '@id', prefix: sAuth.getUrlPrefix, userId: sAuth.getUrlUserId},
                    transformResponse: function (data, headerGetter, status) {
                        if (status > 0 && status < 400) { // TODO: think this error handling through....
                            return angular.fromJson(data).data.rows;
                        } else {
                            return angular.fromJson(data);
                        }
                    }
                },
                update: {
                    method: 'PUT',
                    params: {topicId: '@topicId', commentId: '@id', prefix: sAuth.getUrlPrefix, userId: sAuth.getUrlUserId},
                    transformRequest: function (data) {
                        return angular.toJson({level: data.level});
                    },
                    transformResponse: function (data, headersGetter, status) {
                        if (status > 0 && status < 400) { // TODO: think this error handling through....
                            return angular.fromJson(data).data;
                        } else {
                            return angular.toJson(data);
                        }
                    }
                },
                vote: {
                    method: 'POST',
                    url: sLocation.getAbsoluteUrlApi('/api/topics/:topicId/comments/:commentId/votes'),
                    transformRequest: function (data) {
                        return angular.toJson(data);
                    }
                }
            }
        );

        TopicComment.COMMENT_TYPES = {
            pro: 'pro',
            con: 'con',
            reply: 'reply'
        };

        TopicComment.COMMENT_ORDER_BY = {
            rating: 'rating',
            popularity: 'popularity',
            date: 'date'
        };

        return TopicComment;
    }]);
