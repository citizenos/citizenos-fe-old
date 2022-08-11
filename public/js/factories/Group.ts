import * as angular from 'angular';
import * as _ from 'lodash';

angular
    .module('citizenos')
    .factory('Group', ['$log', '$resource', 'sLocation', '$http', 'Topic', 'GroupMemberUser', 'GroupMemberTopic', function ($log, $resource, sLocation, $http, Topic, GroupMemberUser, GroupMemberTopic) {
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
                        requestObject['name'] = data.name;
                        requestObject['visibility'] = data.visibility;
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
        Group.prototype.memberusers = {
            users: [],
            count: 0,
            totalPages: 0,
            page: 0
        };

        Group.prototype.getMemberUsers = function (offset, limit, search) {
            var group = this;
            if (!limit) {
                limit = 10;
            }
            if (!offset) {
                offset = 0;
            }
            return GroupMemberUser.query({
                groupId: group.id,
                limit: limit,
                search: search,
                offset: offset
            }).$promise
            .then(function (users) {
                group.memberusers.users = users;
                group.memberusers.count = users.length;

                if (users.length) {
                    group.memberusers.count = users[0].countTotal;
                }

                group.memberusers.totalPages = Math.ceil(group.memberusers.count / limit);
                group.memberusers.page = Math.ceil((offset + limit) / limit);

                return users;
            });
        };

        Group.prototype.membertopics = {
            topics: [],
            count: 0,
            totalPages: 0,
            page: 0
        };

        Group.prototype.getMemberTopics = function (offset, limit, order, search) {
            var ITEMS_COUNT_PER_PAGE = 10;
            var group = this;
            order = order || '';
            if (!limit) {
                limit = ITEMS_COUNT_PER_PAGE;
            }
            if (!offset) {
                offset = 0;
            }

            if (search) {
                search = search.trim();
            }

            var statuses = Topic.STATUSES;
            var searchParams = {
                groupId: group.id,
                limit: limit,
                search: search,
                offset: offset,
                statuses: null,
                order: null,
                sortOrder: null
            };
            if (statuses[order]) {
                searchParams.statuses = order;
            }
            var param = order.split('.')[0];
            var sortOrder = order.split('.')[1];
            var orderParams = ['status', 'pinned', 'lastActivity'];
            if (orderParams.indexOf(param) > -1) {
                searchParams.order = param;
                if (sortOrder === 'descending') {
                    searchParams.sortOrder = 'desc';
                }
            }
            group.membertopics.order = order;
            return GroupMemberTopic
                .query(searchParams).$promise
                .then(function (topics) {
                    group.membertopics.topics = topics;
                    group.membertopics.count = topics.length;

                    if (topics.length) {
                        group.membertopics.count = topics[0].countTotal;
                    }

                    group.membertopics.totalPages = Math.ceil(group.membertopics.count / limit);
                    group.membertopics.page = Math.ceil((offset + limit) / limit);

                    return topics;
                });
        };

        return Group;
    }]);
