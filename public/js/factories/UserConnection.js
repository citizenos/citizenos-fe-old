angular
    .module('citizenos')
    .factory('UserConnection', ['$log', '$resource', 'sLocation', 'sAuth', function ($log, $resource, sLocation, sAuth) {
        $log.debug('citizenos.factory.UserConnection');

        var UserConnection = $resource(
            sLocation.getAbsoluteUrlApi('/api/users/:userId/connections'),
            {userId: '@userId'},
            {
                query: {
                    params: {prefix: sAuth.getUrlPrefix, userId: sAuth.getUrlUserId},
                    isArray: true,
                    transformResponse: function (data, headerGetter, status) {
                        if (status > 0 && status < 400) { // TODO: think this error handling through....
                            return angular.fromJson(data).data;
                        } else {
                            return angular.fromJson(data);
                        }
                    }
                }
            }
        );

        return UserConnection;
    }]);
