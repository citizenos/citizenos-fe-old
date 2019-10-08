angular
    .module('citizenos')
    .factory('TopicInviteUser', ['$log', '$resource', 'sLocation', function ($log, $resource, sLocation) {
        $log.debug('citizenos.factory.TopicInviteUser');

        var TopicInviteUser = $resource(
            sLocation.getAbsoluteUrlApi('/api/users/self/topics/:topicId/invites/:inviteId'), // Actually Groups are added to Topic
            {
                topicId: '@topicId',
                inviteId: '@id'
            },
            {
                get: {
                    method: 'GET',
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

        return TopicInviteUser;
    }]);
