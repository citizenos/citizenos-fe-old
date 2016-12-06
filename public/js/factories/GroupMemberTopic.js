angular
    .module('citizenos')
    .factory('GroupMemberTopic', ['$log', '$resource', 'sLocation', 'Topic', function ($log, $resource, sLocation, Topic) {
        $log.debug('citizenos.factory.GroupMemberUser');

        var GroupMemberTopic = $resource(
            sLocation.getAbsoluteUrlApi('/api/users/self/topics/:topicId/members/groups/:groupId'),
            {topicId: '@id', groupId: '@groupId'},
            {
                query: {
                    url: sLocation.getAbsoluteUrlApi('/api/users/self/groups/:groupId/topics'),
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
                        return angular.toJson({level: data.level});
                    },
                    transformResponse: function (data, headersGetter, status) {
                        if (status < 400) { // FIXME: think this error handling through....
                            return angular.fromJson(data).data.rows;
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

        GroupMemberTopic.prototype.canDelete = function () {
            return this.permission.level = GroupMemberTopic.LEVELS.admin;
        };

        return GroupMemberTopic;
    }]);
