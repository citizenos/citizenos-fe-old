angular
    .module('citizenos')
    .factory('TopicMemberGroup', ['$log', '$resource', 'sLocation', 'Group', function ($log, $resource, sLocation, Group) {
        $log.debug('citizenos.factory.TopicMemberGroup');

        var TopicMemberGroup = $resource(
            sLocation.getAbsoluteUrlApi('/api/users/self/topics/:topicId/members/groups/:groupId'),
            {topicId: '@topicId', groupId: '@id'},
            {
                query: {
                    isArray: true,
                    transformResponse: function (data, headersGetter, status) {
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
                save: {
                    method: 'POST',
                    params: {topicId: '@topicId', groupId: null},
                    url: sLocation.getAbsoluteUrlApi('/api/users/self/topics/:topicId/members/groups'),
                    transformRequest: function (data) {
                        return angular.toJson({topicId: data.topicId, groupId: data.id, level: data.level});
                    },
                    transformResponse: function (data, headersGetter, status) {
                        return angular.fromJson(data);
                    }
                },
                update: {
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
                },
                delete: {
                    method: 'DELETE'
                }
            }
        );

        // FIXME: Should be inherited from Topic?
        TopicMemberGroup.LEVELS = {
            none: 'none', // Enables to override inherited permissions.
            read: 'read',
            edit: 'edit',
            admin: 'admin'
        };

        // FIXME: Should be inherited from Topic?
        TopicMemberGroup.prototype.isPrivate = function () {
            return this.visibility === Group.VISIBILITY.private;
        };

        TopicMemberGroup.prototype.canUpdate = function () {
            return this.permission.level === TopicMemberGroup.LEVELS.admin; // User level for the Group
        };

        TopicMemberGroup.prototype.canDelete = function () {
            return this.permission.level === TopicMemberGroup.LEVELS.admin; // User level for the Group
        };

        return TopicMemberGroup;
    }]);
