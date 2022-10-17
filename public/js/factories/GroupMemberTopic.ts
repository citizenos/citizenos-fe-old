import * as angular from 'angular';
angular
    .module('citizenos')
    .factory('GroupMemberTopic', ['$log', '$resource', 'sAuth', 'sLocation', 'Topic', function ($log, $resource, sAuth, sLocation, Topic) {
        $log.debug('citizenos.factory.GroupMemberTopic');

        var getUrlPrefix = function () {
            var prefix = sAuth.getUrlPrefix();
            if (!prefix) {
                prefix = '@prefix';
            }
            return prefix;
        };

        var getUrlUser = function () {
            var userId = sAuth.getUrlUserId();
            if (!userId) {
                userId = '@userId';
            }
            return userId;
        };

        var GroupMemberTopic = $resource(
            sLocation.getAbsoluteUrlApi('/api/:prefix/:userId/topics/:topicId/members/groups/:groupId'), // Actually Groups are added to Topic
            {
                topicId: '@id',
                groupId: '@groupId',
                prefix: getUrlPrefix,
                userId: getUrlUser
            },
            {
                query: {
                    url: sLocation.getAbsoluteUrlApi('/api/:prefix/:userId/groups/:groupId/members/topics'),
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
                update: {
                    method: 'PUT',
                    transformRequest: function (data) {
                        return angular.toJson({level: data.permission.levelGroup});
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
                    params: {
                        topicId: '@id',
                        groupId: null
                    },
                    url: sLocation.getAbsoluteUrlApi('/api/users/self/topics/:topicId/members/groups'),
                    transformRequest: function (data) {
                        return angular.toJson({
                            topicId: data.id,
                            groupId: data.groupId,
                            level: data.level
                        });
                    },
                    transformResponse: function (data, headersGetter, status) {
                        return angular.fromJson(data);
                    }
                },
                delete: {
                    method: 'DELETE'
                }
            }
        );

        GroupMemberTopic.LEVELS = {
            read: 'read',
            edit: 'edit',
            admin: 'admin'
        };

        // FIXME: Yes, we're doing something wrong here... GroupMemberTopic should be Topic and I should not have to duplicate Topic functions here...
        GroupMemberTopic.prototype.isPrivate = function () {
            return this.visibility === Topic.VISIBILITY.private;
        };

        GroupMemberTopic.prototype.canUpdate = function () {
            return this.permission.level === GroupMemberTopic.LEVELS.admin;
        };

        GroupMemberTopic.prototype.canDelete = function () {
            return this.permission.level === GroupMemberTopic.LEVELS.admin;
        };

        /**
         * Can one edit Topics settings and possibly description (content)?
         * Use canEditDescription() if you only need to check if content can be edited.
         *
         * @returns {boolean}
         *
         * @see Topic.prototype.canEditDescription()
         */
        GroupMemberTopic.prototype.canEdit = function () {
            return [GroupMemberTopic.LEVELS.admin, GroupMemberTopic.LEVELS.edit].indexOf(this.permission.level) > -1;
        };

        GroupMemberTopic.prototype.togglePin = function () {
            var self = this;
            var topic = new Topic(this);

            if (!self.pinned) {
                return topic.$addToPinned()
                    .then(function () {
                        self.pinned = true;
                    });
            } else {
                return topic.$removeFromPinned()
                    .then(function () {
                        self.pinned = false;
                    })
            }
        };

        return GroupMemberTopic;
    }]);
