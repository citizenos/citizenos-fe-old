import * as angular from 'angular';

angular
    .module('citizenos')
    .factory('TopicEvent', ['$log', '$resource', 'sLocation', 'sAuth', function ($log, $resource, sLocation, sAuth) {
        $log.debug('citizenos.factory.TopicEvent');

        var path = '/api/:prefix/:userId/topics/:topicId/events/:eventId';

        var TopicEvent = $resource(
            sLocation.getAbsoluteUrlApi(path),
            {topicId: '@topicId', eventId: '@id', prefix: sAuth.getUrlPrefix, userId: sAuth.getUrlUserId},
            {
                save: {
                    method: 'POST',
                    transformRequest: function (data) {
                        return angular.toJson(data);
                    },
                    transformResponse: function (data, headersGetter, status) {
                        if (status > 0 && status < 400) {
                            return angular.fromJson(data).data;
                        } else {
                            return angular.fromJson(data);
                        }
                    }
                },
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
                update: {
                    method: 'PUT',
                    transformResponse: function(data, headersGetter, status) {
                        if (status > 0 && status < 400) { // TODO: think this error handling through....
                            return angular.fromJson(data).data;
                        } else {
                            return angular.fromJson(data);
                        }
                    }
                },
                query: {
                    method: 'GET',
                    isArray: true,
                    transformResponse: function (data, headersGetter, status) {
                        if (status > 0 && status < 400) {
                            return angular.fromJson(data).data.rows || [];
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

        return TopicEvent;
    }]);
