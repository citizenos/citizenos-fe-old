import * as angular from 'angular';

angular
    .module('citizenos')
    .service('sGroup', ['$http', '$log', '$q', 'sLocation', function ($http, $log, $q, sLocation) {
        var sGroup = this;

        sGroup.list = function () {
            var path = sLocation.getAbsoluteUrlApi('/api/users/self/groups');
            return $http.get(path);
        };

        sGroup.membersList = function (groupId) {
            var path = sLocation.getAbsoluteUrlApi('/api/users/self/groups/:groupId/members', {groupId: groupId});
            return $http.get(path);
        };

        sGroup.topicsList = function (groupId) {
            var path = sLocation.getAbsoluteUrlApi('/api/users/self/groups/:groupId/topics', {groupId: groupId});
            return $http.get(path);
        }
    }]);
