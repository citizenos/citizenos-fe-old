import * as angular from 'angular';
angular
    .module('citizenos')
    .factory('Mention', ['$log', '$resource', 'sLocation', 'sAuth', function ($log, $resource, sLocation, sAuth) {
        $log.debug('citizenos.factory.Mention');

        var Mention = $resource(
            sLocation.getAbsoluteUrlApi('/api/:prefix/:userId/topics/:topicId/mentions'),
            {topicId: '@topicId'},
            {
                query: {
                    params: {topicId: '@topicId', prefix: sAuth.getUrlPrefix, userId: sAuth.getUrlUserId},
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
