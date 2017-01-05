angular
    .module('citizenos')
    .factory('Topic', ['$log', '$resource', 'sLocation', 'TopicMemberUser', function ($log, $resource, sLocation, TopicMemberUser) {
        $log.debug('citizenos.factory.Topic');

        var Topic = $resource(
            sLocation.getAbsoluteUrlApi('/api/users/self/topics/:topicId'),
            {topicId: '@id'},
            {
                query: {
                    isArray: true,
                    transformResponse: function (data) {
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
                        var requestObject = {};
                        _.forEach(data.toJSON(), function (value, key) { // Remove all object properties as we have none we care about in the server side
                            if (!_.isObject(value)) {
                                requestObject[key] = value;
                            }
                        });
                        return angular.toJson(requestObject);
                    }
                },
                save: {
                    method: 'POST',
                    transformResponse: function (data) {
                        return angular.fromJson(data).data;
                    }
                }
            }
        );

        Topic.VISIBILITY = {
            public: 'public', // Everyone has read-only on the Topic.  Pops up in the searches..
            private: 'private' // No-one can see except collaborators
        };

        Topic.prototype.isPrivate = function () {
            return this.visibility === Topic.VISIBILITY.private;
        };

        Topic.prototype.canUpdate = function () {
            return this.permission.level === TopicMemberUser.LEVELS.admin;
        };

        Topic.prototype.canDelete = function () {
            return this.canUpdate();
        };

        return Topic;
    }]);
