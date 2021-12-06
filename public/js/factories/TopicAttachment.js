angular
    .module('citizenos')
    .factory('TopicAttachment', ['$log', '$resource', 'sLocation', 'sAuth', 'cosConfig', function ($log, $resource, sLocation, sAuth, cosConfig) {
        $log.debug('citizenos.factory.TopicAttachment');

        var path = '/api/:prefix/:userId/topics/:topicId/attachments/:attachmentId';

        var TopicAttachment = $resource(
            sLocation.getAbsoluteUrlApi(path),
            {topicId: '@topicId', attachmentId: '@id'},
            {
                save: {
                    method: 'POST',
                    params: {topicId: '@topicId', attachmentId: '@id', prefix: sAuth.getUrlPrefix, userId: sAuth.getUrlUserId},
                    headers: {
                        'content-type': function (data) {
                            if (data.data.file) {
                                return undefined;
                            }
                        }
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
                query: {
                    isArray: true,
                    url: sLocation.getAbsoluteUrlApi('/api/:prefix/:userId/topics/:topicId/attachments'),
                    params: {topicId: '@topicId', attachmentId: '@id', prefix: sAuth.getUrlPrefix, userId: sAuth.getUrlUserId},
                    transformResponse: function (data, headerGetter, status) {
                        if (status > 0 && status < 400) { // TODO: think this error handling through....
                            var result = angular.fromJson(data).data.rows;
                            return result;
                        } else {
                            return angular.fromJson(data);
                        }
                    }
                },
                update: {
                    method: 'PUT',
                    params: {topicId: '@topicId', attachmentId: '@id', prefix: sAuth.getUrlPrefix, userId: sAuth.getUrlUserId},
                    transformRequest: function (data) {
                        var requestObject = {};
                        _.forEach(data.toJSON(), function (value, key) { // Remove all object properties as we have none we care about in the server side
                            if (!_.isObject(value)) {
                                requestObject[key] = value;
                            }
                        });
                        return angular.toJson(requestObject);
                    },
                    transformResponse: function (data, headersGetter, status) {
                        if (status > 0 && status < 400) { // TODO: think this error handling through....
                            return angular.fromJson(data).data;
                        } else {
                            return angular.fromJson(data);
                        }
                    }
                },
                delete: {
                    method: 'DELETE',
                    params: {topicId: '@topicId', attachmentId: '@id', prefix: sAuth.getUrlPrefix, userId: sAuth.getUrlUserId},
                    transformResponse: function (data, headersGetter, status) {
                        if (status > 0 && status < 400) { // TODO: think this error handling through....
                            return angular.fromJson(data).data;
                        } else {
                            return angular.toJson(data);
                        }
                    }
                }
            }
        );

        TopicAttachment.SOURCES = {
            upload: 'upload',
            dropbox: 'dropbox',
            onedrive: 'onedrive',
            googledrive: 'googledrive'
        };

        return TopicAttachment;
    }]);
