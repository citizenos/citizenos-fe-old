angular
    .module('citizenos')
    .factory('TopicVote', ['$log', '$resource', 'sLocation', function ($log, $resource, sLocation) {
        $log.debug('citizenos.factory.TopicVote');

        var TopicVote = $resource(
            sLocation.getAbsoluteUrlApi('/api/users/self/topics/:topicId/votes/:voteId'),
            {topicId: '@topicId', voteId: '@id'},
            {
                get: {
                    transformResponse: function (data) {
                        if (status < 400) { // FIXME: think this error handling through....
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
