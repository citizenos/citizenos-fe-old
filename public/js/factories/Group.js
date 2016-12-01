angular
    .module('citizenos')
    .factory('Group', ['$log', '$resource', 'sLocation', 'Topic', function ($log, $resource, sLocation, Topic) {
        $log.debug('citizenos.factory.Group');
        var Group = $resource(
            sLocation.getAbsoluteUrlApi('/api/users/self/groups/:groupId'),
            {groupId: '@id'},
            {
                query: {
                    isArray: true,
                    transformResponse: function (data) {
                        var array = angular.fromJson(data).data.rows;
                        array.forEach(function (group) { // TODO: FIX THE API - group.topics should return topics[] with 1 Topic in it.
                            if (group.topics && group.topics.latest) {
                                group.topics.latest = new Topic(group.topics.latest);
                            }
                        });
                        return array;
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

        return Group;
    }]);
