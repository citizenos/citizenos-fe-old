angular
    .module('citizenos')
    .factory('Vote', ['$log', '$resource', 'sLocation', function ($log, $resource, sLocation) {
        $log.debug('citizenos.factory.Vote');

        var path = '/api/users/self/topics/:topicId/votes';

        var Vote = $resource(
            sLocation.getAbsoluteUrlApi(path),
            {topicId: '@topicId'},
            {
                save: {
                    method: 'POST',
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

        Vote.STATUSES = {
            inProgress: 'inProgress', // Being worked on
            voting: 'voting', // Is being voted which means the Topic is locked and cannot be edited.
            followUp: 'followUp', // Done editing Topic and executing on the follow up plan.
            closed: 'closed' // Final status - Topic is completed and no editing/reopening/voting can occur.
        };

        Vote.VOTE_TYPES = {
            regular: 'regular',
            multiple: 'multiple'
        };

        Vote.VOTE_AUTH_TYPES = {
            soft: 'soft',
            hard: 'hard'
        };

        return Vote;
    }]);
