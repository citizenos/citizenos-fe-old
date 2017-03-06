angular
    .module('citizenos')
    .factory('Mention', ['$log', '$resource', 'sLocation', 'sAuth', function ($log, $resource, sLocation, sAuth) {
        $log.debug('citizenos.factory.Mention');

        var path = '/api/topics/:topicId/mentions';
        if(sAuth.user.loggedIn) {
            path = '/api/users/self/topics/:topicId/mentions';
        }

        var Mention = $resource(
            sLocation.getAbsoluteUrlApi(path),
            {topicId: '@topicId'},
            {
                query: {
                    isArray: true,
                    transformResponse: function (data, headerGetter, status) {
                        if (status > 0 && status < 400) { // TODO: think this error handling through....
                            return angular.fromJson(data).data.rows;
                        } else {
                            return angular.fromJson(data);
                        }
                    }
                }
            }
        );

        return Mention;
    }]);
