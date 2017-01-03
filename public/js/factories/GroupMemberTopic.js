angular
    .module('citizenos')
    .factory('GroupMemberTopic', ['$log', '$resource', 'sLocation', 'Topic', function ($log, $resource, sLocation, Topic) {
        $log.debug('citizenos.factory.GroupMemberTopic');

        var GroupMemberTopic = $resource(
            sLocation.getAbsoluteUrlApi('/api/users/self/topics/:topicId/members/groups/:groupId'), // Actually Groups are added to Topic
            {topicId: '@id', groupId: '@groupId'},
            {
                query: {
                    url: sLocation.getAbsoluteUrlApi('/api/users/self/groups/:groupId/members/topics'),
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
                        return angular.toJson({level: data.permission.levelGroup});
                    },
                    transformResponse: function (data, headersGetter, status) {
                        if (status < 400) { // FIXME: think this error handling through....
                            return angular.fromJson(data).data;
                        } else {
                            return angular.fromJson(data);
                        }
                    }
                },
                save: {
                    method: 'POST',
                    url: sLocation.getAbsoluteUrlApi('/api/users/self/topics/:topicId/members/groups'),
                    transformResponse: function (data) {
                        return angular.fromJson(data);
                    }
                },
                delete: {
                    method: 'DELETE'
                }
            }
        );

        GroupMemberTopic.LEVELS = {
            none: 'none', // Enables to override inherited permissions.
            read: 'read',
            edit: 'edit',
            admin: 'admin'
        };

        // FIXME: Should be inherited from Topic?
        GroupMemberTopic.prototype.isPrivate = function () {
            return this.visibility === Topic.VISIBILITY.private;
        };

        GroupMemberTopic.prototype.canUpdate = function () {
            return this.permission.level === GroupMemberTopic.LEVELS.admin;
        };

        GroupMemberTopic.prototype.canDelete = function () {
            return this.permission.level === GroupMemberTopic.LEVELS.admin;
        };

        return GroupMemberTopic;
    }]);
