angular
    .module('citizenos')
    .factory('TopicJoin', ['$log', '$resource', 'sLocation', function ($log, $resource, sLocation) {
        $log.debug('citizenos.factory.TopicJoin');

        var path = '/api/users/:userId/topics/:topicId/join/:token';

        var TopicJoin = $resource(
            sLocation.getAbsoluteUrlApi(path),
            {
                userId: '@userId',
                topicId: '@topicId',
                token: '@token'
            },
            {
                save: { // Regenerates a whole new TokenJoin and OVERWRITES existing, thus NOT POST
                    method: 'PUT',
                    transformResponse: function (data, headersGetter, status) {
                        if (status > 0 && status < 400) { // TODO: think this error handling through....
                            return angular.fromJson(data).data;
                        } else {
                            return angular.fromJson(data);
                        }
                    }
                },
                update: { // Update existing TokenJoin data - initially only level
                    method: 'PUT',
                    transformRequest: function (data) {
                        return angular.toJson({level: data.level});
                    },
                    transformResponse: function (data, headersGetter, status) {
                        if (status > 0 && status < 400) { // TODO: think this error handling through....
                            return angular.fromJson(data).data;
                        } else {
                            return angular.fromJson(data);
                        }
                    }
                }
            }
        );

        return TopicJoin;
    }]);
