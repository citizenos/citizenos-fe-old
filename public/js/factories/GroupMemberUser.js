angular
    .module('citizenos')
    .factory('GroupMemberUser', ['$log', '$resource', 'sLocation', function ($log, $resource, sLocation) {
        $log.debug('citizenos.factory.GroupMemberUser');

        var GroupMemberUser = $resource(
            sLocation.getAbsoluteUrlApi('/api/users/self/groups/:groupId/members/:userId'),
            {groupId: '@groupId', userId: '@id'},
            {
                query: {
                    isArray: true,
                    transformResponse: function (data, headersGetter, status) {
                        if (status < 400) { // FIXME: think this error handling through....
                            return angular.fromJson(data).data.rows;
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
                        if (status < 400) { // FIXME: think this error handling through....
                            return angular.fromJson(data).data;
                        } else {
                            return angular.fromJson(data);
                        }
                    }
                },
                delete: {
                    method: 'DELETE'
                }
            }
        );

        GroupMemberUser.LEVELS = {
            read: 'read',
            admin: 'admin'
        };

        return GroupMemberUser;
    }]);
