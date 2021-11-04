angular
    .module('citizenos')
    .factory('Group', ['$log', '$resource', 'sLocation', '$http', 'Topic', 'GroupMemberUser', function ($log, $resource, sLocation, $http, Topic, GroupMemberUser) {
        $log.debug('citizenos.factory.Group');
        var Group = $resource(
            sLocation.getAbsoluteUrlApi('/api/users/self/groups/:groupId'),
            {groupId: '@id'},
            {
                get: {
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
                    transformResponse: function (data, headersGetter, status) {
                        if (status > 0 && status < 400) { // TODO: think this error handling through....
                            var array = angular.fromJson(data).data.rows || [];
                            array.forEach(function (group) {
                                if (group.members.topics && group.members.topics.latest) {
                                    group.members.topics.latest = new Topic(group.members.topics.latest);
                                }
                            });
                            return array;
                        } else {
                            return angular.fromJson(data);
                        }
                    }
                },
                update: {
                    method: 'PUT',
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
                save: {
                    method: 'POST',
                    url: sLocation.getAbsoluteUrlApi('/api/users/self/groups'),
                    transformRequest: function (data) {
                        var requestObject = {};
                        requestObject.name = data.name;
                        requestObject.visibility = data.visibility;
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
                    method: 'DELETE'
                },
                join: {
                    method: 'POST',
                    params: {token: '@id'},
                    url: sLocation.getAbsoluteUrlApi('/api/groups/join/:token'),
                    transformResponse: function (data, headersGetter, status) {
                        if (status > 0 && status < 400) {
                            return angular.fromJson(data);
                        } else {
                            return angular.fromJson(data);
                        }
                    }
                }
            }
        );

        Group.VISIBILITY = {
            public: 'public',
            private: 'private'
        };

        Group.prototype.canUpdate = function () {
            return this.permission && this.permission.level === GroupMemberUser.LEVELS.admin;
        };

        Group.prototype.canDelete = function () {
            return this.canUpdate();
        };

        return Group;
    }]);
