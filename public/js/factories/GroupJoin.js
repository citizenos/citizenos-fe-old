angular
    .module('citizenos')
    .factory('GroupJoin', ['$log', '$resource', 'sLocation', function ($log, $resource, sLocation) {
        $log.debug('citizenos.factory.GroupJoin');

        var path = '/api/users/:userId/groups/:groupId/join/:token';

        var GroupJoin = $resource(
            sLocation.getAbsoluteUrlApi(path),
            {
                userId: '@userId',
                groupId: '@groupId',
                token: '@token'
            },
            {
                save: { // Regenerates a whole new GroupJoin and OVERWRITES existing, thus NOT POST
                    method: 'PUT',
                    transformResponse: function (data, headersGetter, status) {
                        if (status > 0 && status < 400) { // TODO: think this error handling through....
                            return angular.fromJson(data).data;
                        } else {
                            return angular.fromJson(data);
                        }
                    }
                },
                update: { // Update existing GroupJoin data - initially only level
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

        return GroupJoin;
    }]);
