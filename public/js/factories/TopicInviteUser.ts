import * as angular from 'angular';
angular
    .module('citizenos')
    .factory('TopicInviteUser', ['$log', '$resource', 'sLocation', function ($log, $resource, sLocation) {
        $log.debug('citizenos.factory.TopicInviteUser');

        var TopicInviteUser = $resource(
            sLocation.getAbsoluteUrlApi('/api/users/self/topics/:topicId/invites/users/:inviteId'),
            {
                topicId: '@topicId',
                inviteId: '@id'
            },
            {
                get: {
                    method: 'GET',
                    transformResponse: function (data, headersGetter, status) {
                        if (status > 0 && status < 400) { // TODO: think this error handling through....
                            var jsonResponse = angular.fromJson(data);
                            // The API returns 20002 status code for non-registered User. Felt better not putting the isRegistered property to the User on the API side.
                            // @see https://github.com/citizenos/citizenos-fe/issues/773
                            jsonResponse.data.user.isRegistered = jsonResponse.status.code !== 20002;
                            return jsonResponse.data;
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
                },
                update: {
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

        return TopicInviteUser;
    }]);
