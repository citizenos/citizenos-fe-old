angular
    .module('citizenos')
    .factory('GroupInviteUser', ['$log', '$resource', 'sLocation', function ($log, $resource, sLocation) {
        $log.debug('citizenos.factory.GroupInviteUser');

        var GroupInviteUser = $resource(
            sLocation.getAbsoluteUrlApi('/api/users/self/groups/:groupId/invites/users/:inviteId'),
            {
                groupId: '@groupId',
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
                        groupId: '@groupId',
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
                        groupId: function (groupInvite) {
                            if (groupInvite.groupId) { // FIXME: REVIEW: HMM... when GroupInviteUser is created only "groupId" is returned, but when you read the invite, you get it nested in "group.id"
                                return '@groupId'
                            } else {
                                return '@group.id';
                            }
                        },
                        inviteId: '@id'
                    },
                    url: sLocation.getAbsoluteUrlApi('/api/users/self/groups/:groupId/invites/users/:inviteId/accept'),
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

        return GroupInviteUser;
    }]);
