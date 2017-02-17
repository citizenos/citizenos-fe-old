angular
    .module('citizenos')
    .factory('TopicVote', ['$log', '$resource', 'sLocation', function ($log, $resource, sLocation) {
        $log.debug('citizenos.factory.TopicVote');

        var TopicVote = $resource(
            sLocation.getAbsoluteUrlApi('/api/users/self/topics/:topicId/votes/:voteId'),
            {topicId: '@topicId', voteId: '@id'},
            {
                get: {
                    transformResponse: function (data, headersGetter, status) {
                        if (status > 0 && status < 400) { // TODO: think this error handling through....
                            return angular.fromJson(data).data;
                        } else {
                            return angular.fromJson(data);
                        }
                    }
                },
                update: {
                    method: 'PUT',
                    transformResponse: function(data, headersGetter, status) {
                        if (status > 0 && status < 400) { // TODO: think this error handling through....
                            return angular.fromJson(data).data;
                        } else {
                            return angular.fromJson(data);
                        }
                    }
                }
            }
        );

        return TopicVote;
    }]);
