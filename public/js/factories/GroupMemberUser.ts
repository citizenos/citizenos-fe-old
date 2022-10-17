import * as angular from 'angular';
angular
    .module('citizenos')
    .factory('GroupMemberUser', ['$log', '$resource', 'sLocation', 'sAuth', function ($log, $resource, sLocation, sAuth) {
        $log.debug('citizenos.factory.GroupMemberUser');
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

        var GroupMemberUser = $resource(
            sLocation.getAbsoluteUrlApi('/api/:prefix/:user/groups/:groupId/members/users/:userId'),
            {
                groupId: '@groupId',
                userId: '@id',
                user: getUrlUser,
                prefix: getUrlPrefix
            },
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
                save: {
                    method: 'POST',
                    url: sLocation.getAbsoluteUrlApi('/api/users/self/groups/:groupId/members/users'),
                    transformResponse: function (data) {
                        return angular.fromJson(data).data;
                    }
                }
            }
        );

        GroupMemberUser.LEVELS = {
            read: 'read',
            admin: 'admin'
        };

        return GroupMemberUser;
    }]);
