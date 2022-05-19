import * as angular from 'angular';
angular
    .module('citizenos')
    .factory('TopicReport', ['$log', '$resource', 'sLocation', 'sAuth', function ($log, $resource, sLocation, sAuth) {
        $log.debug('citizenos.factory.TopicReport');

        var path = '/api/:prefix/:userId/topics/:topicId/reports/:reportId';

        var TopicReport = $resource(
            sLocation.getAbsoluteUrlApi(path),
            {
                topicId: '@topicId',
                reportId: '@id'
            },
            {
                save: {
                    method: 'POST',
                    params: {
                        topicId: '@topicId',
                        reportId: '@id',
                        prefix: sAuth.getUrlPrefix,
                        userId: sAuth.getUrlUserId
                    },
                    transformRequest: function (data) {
                        return angular.toJson(data);
                    },
                    transformResponse: function (data, headersGetter, status) {
                        if (status > 0 && status < 400) { // TODO: think this error handling through....
                            return angular.fromJson(data).data;
                        } else {
                            return angular.fromJson(data);
                        }
                    }
                },
                moderate: {
                    method: 'POST',
                    url: sLocation.getAbsoluteUrlApi('/api/topics/:topicId/reports/:id/moderate'),
                    transformRequest: function (data) {
                        return angular.toJson(data);
                    },
                    transformResponse: function (data, headersGetter, status) {
                        if (status > 0 && status < 400) { // TODO: think this error handling through....
                            return angular.fromJson(data).data;
                        } else {
                            return angular.fromJson(data);
                        }
                    }
                },
                review: {
                    method: 'POST',
                    url: sLocation.getAbsoluteUrlApi('/api/topics/:topicId/reports/:id/review'),
                    transformRequest: function (data) {
                        return angular.toJson(data);
                    },
                    transformResponse: function (data, headersGetter, status) {
                        if (status > 0 && status < 400) { // TODO: think this error handling through....
                            return angular.fromJson(data).data;
                        } else {
                            return angular.fromJson(data);
                        }
                    }
                },
                resolve: {
                    method: 'POST',
                    url: sLocation.getAbsoluteUrlApi('/api/topics/:topicId/reports/:id/resolve'),
                    transformRequest: function (data) {
                        return angular.toJson(data);
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

        TopicReport.TYPES = {
            abuse: 'abuse', // is abusive or insulting
            obscene: 'obscene', // contains obscene language
            spam: 'spam', // contains spam or is unrelated to topic
            hate: 'hate', // contains hate speech
            netiquette: 'netiquette', // infringes (n)etiquette
            duplicate: 'duplicate' // duplicate
        };

        return TopicReport;
    }]);
