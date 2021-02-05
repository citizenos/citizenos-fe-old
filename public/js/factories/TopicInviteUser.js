angular
    .module('citizenos')
    .factory('TopicInviteUser', ['$log', '$resource', 'sLocation', function ($log, $resource, sLocation) {
        $log.debug('citizenos.factory.TopicInviteUser');

        var TopicInviteUser = $resource(
            sLocation.getAbsoluteUrlApi('/api/users/self/topics/:topicId/invites/users/:inviteId'), // Actually Groups are added to Topic
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
                },
                query: {
                    isArray: true,
                    params: {
                        topicId: '@topicId',
                        inviteId: '@id'
                    },
                    transformResponse: function (data, headerGetter, status) {
                        if (status > 0 && status < 400) { // TODO: think this error handling through....
                            var result = angular.fromJson(data).data;
                            result.rows.forEach(function (item) {
                                item.countTotal = result.countTotal;
                            });

                            return result.rows;
                        } else {
                            return angular.fromJson(data);
                        }
                    }
                },
                accept: {
                    method: 'POST',
                    params: {
                        topicId: function (topicInvite) {
                            if (topicInvite.topicId) { // FIXME: REVIEW: HMM... when TopicInviteUser is created only "topicId" is returned, but when you read the invite, you get it nested in "topic.id"
                                return '@topicId'
                            } else {
                                return '@topic.id';
                            }
                        },
                        inviteId: '@id'
                    },
                    url: sLocation.getAbsoluteUrlApi('/api/users/self/topics/:topicId/invites/users/:inviteId/accept'),
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
