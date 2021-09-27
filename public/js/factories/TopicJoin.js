angular
    .module('citizenos')
    .factory('TopicJoin', ['$log', '$resource', 'sLocation', function ($log, $resource, sLocation) {
        $log.debug('citizenos.factory.TopicJoin');

        var path = '/api/users/:userId/topics/:topicId/join';

        var TopicJoin = $resource(
            sLocation.getAbsoluteUrlApi(path),
            {
                userId: '@userId',
                topicId: '@topicId'
            },
            {
                update: {
                    method: 'PUT',
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
